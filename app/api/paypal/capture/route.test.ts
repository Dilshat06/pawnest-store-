import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique:        vi.fn(),
      updateMany:        vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  },
}))

vi.mock("@/lib/paypal", () => ({
  paypal: {
    captureOrder: vi.fn(),
  },
}))

vi.mock("@/lib/order-fulfillment", () => ({
  forwardOrderToCJ: vi.fn(),
}))

vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendAdminAlertEmail:        vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from "@/lib/prisma"
import { paypal } from "@/lib/paypal"
import { forwardOrderToCJ } from "@/lib/order-fulfillment"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { GET } from "./route"

function makeRequest(params: string) {
  return new NextRequest(`http://localhost/api/paypal/capture?${params}`)
}

describe("GET /api/paypal/capture", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects to /cart when orderId or token is missing", async () => {
    const res = await GET(makeRequest("orderId=order1"))
    expect(res.headers.get("location")).toBe("https://test.example.com/cart")
    expect(prisma.order.findUnique).not.toHaveBeenCalled()
  })

  it("redirects to /cart when the PayPal token doesn't match the order's stored paypalOrderId", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order1", status: "PENDING", paypalOrderId: "different-paypal-id", accessToken: "tok",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await GET(makeRequest("orderId=order1&token=paypal-order-1"))

    expect(res.headers.get("location")).toBe("https://test.example.com/cart")
    expect(paypal.captureOrder).not.toHaveBeenCalled()
  })

  it("skips re-capturing and redirects straight to order-success if already processed", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order1", status: "PAID", paypalOrderId: "paypal-order-1", accessToken: "tok",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await GET(makeRequest("orderId=order1&token=paypal-order-1"))

    expect(paypal.captureOrder).not.toHaveBeenCalled()
    expect(res.headers.get("location")).toBe("https://test.example.com/order-success?orderId=order1&token=tok")
  })

  it("captures, marks PAID, emails, forwards to CJ, and redirects to order-success on success", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order1", status: "PENDING", paypalOrderId: "paypal-order-1", accessToken: "tok",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(paypal.captureOrder).mockResolvedValue({ status: "COMPLETED" } as any)
    vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
      id: "order1", customerEmail: "a@b.com", customerName: "Jane",
      accessToken: "tok", totalPrice: 10, items: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await GET(makeRequest("orderId=order1&token=paypal-order-1"))

    expect(paypal.captureOrder).toHaveBeenCalledWith("paypal-order-1")
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: "order1", status: "PENDING" },
      data:  { status: "PAID" },
    })
    expect(sendOrderConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(forwardOrderToCJ).toHaveBeenCalledWith("order1")
    expect(res.headers.get("location")).toBe("https://test.example.com/order-success?orderId=order1&token=tok")
  })

  it("redirects to /cart with an error when PayPal capture doesn't complete", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order1", status: "PENDING", paypalOrderId: "paypal-order-1", accessToken: "tok",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(paypal.captureOrder).mockResolvedValue({ status: "PENDING" } as any)

    const res = await GET(makeRequest("orderId=order1&token=paypal-order-1"))

    expect(prisma.order.updateMany).not.toHaveBeenCalled()
    expect(res.headers.get("location")).toBe("https://test.example.com/cart?error=payment_failed")
  })
})
