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
    verifyWebhookSignature: vi.fn(),
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
import { POST } from "./route"

const captureEvent = {
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  resource: {
    custom_id: "order1",
    supplementary_data: { related_ids: { order_id: "paypal-order-1" } },
  },
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/webhook/paypal", {
    method:  "POST",
    headers: {
      "paypal-transmission-id":   "tid",
      "paypal-transmission-time": "ttime",
      "paypal-cert-url":          "https://api.paypal.com/cert",
      "paypal-auth-algo":         "SHA256withRSA",
      "paypal-transmission-sig":  "sig",
    },
    body: JSON.stringify(body),
  })
}

describe("POST /api/webhook/paypal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PAYPAL_WEBHOOK_ID = "webhook-id-123"
  })

  it("rejects events with an invalid signature", async () => {
    vi.mocked(paypal.verifyWebhookSignature).mockResolvedValue(false)

    const res = await POST(makeRequest(captureEvent))

    expect(res.status).toBe(400)
    expect(prisma.order.updateMany).not.toHaveBeenCalled()
  })

  it("processes a verified capture event and forwards the order to CJ", async () => {
    vi.mocked(paypal.verifyWebhookSignature).mockResolvedValue(true)
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order1", status: "PENDING", paypalOrderId: "paypal-order-1",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
      id: "order1", customerEmail: "a@b.com", customerName: "Jane",
      accessToken: "tok", totalPrice: 10, items: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await POST(makeRequest(captureEvent))

    expect(res.status).toBe(200)
    expect(forwardOrderToCJ).toHaveBeenCalledWith("order1")
  })

  it("is idempotent: skips already-processed orders without re-forwarding to CJ", async () => {
    vi.mocked(paypal.verifyWebhookSignature).mockResolvedValue(true)
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "order1", status: "PENDING", paypalOrderId: "paypal-order-1",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 0 })

    const res = await POST(makeRequest(captureEvent))

    expect(res.status).toBe(200)
    expect(prisma.order.findUniqueOrThrow).not.toHaveBeenCalled()
    expect(forwardOrderToCJ).not.toHaveBeenCalled()
  })
})
