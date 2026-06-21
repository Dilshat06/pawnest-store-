import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      updateMany:        vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  },
}))

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
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
import { stripe } from "@/lib/stripe"
import { forwardOrderToCJ } from "@/lib/order-fulfillment"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { POST } from "./route"

const completedEvent = {
  type: "checkout.session.completed",
  data: { object: { metadata: { orderId: "order1" } } },
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/webhook/stripe", {
    method:  "POST",
    headers: { "stripe-signature": "sig" },
    body:    JSON.stringify(body),
  })
}

describe("POST /api/webhook/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  })

  it("rejects requests with no stripe-signature header", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/webhook/stripe", { method: "POST", body: "{}" })
    )

    expect(res.status).toBe(400)
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled()
  })

  it("rejects events with an invalid signature", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error("bad signature")
    })

    const res = await POST(makeRequest(completedEvent))

    expect(res.status).toBe(400)
    expect(prisma.order.updateMany).not.toHaveBeenCalled()
  })

  it("processes a verified checkout.session.completed event and forwards the order to CJ", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(completedEvent as any)
    vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
      id: "order1", customerEmail: "a@b.com", customerName: "Jane",
      accessToken: "tok", totalPrice: 10, items: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res = await POST(makeRequest(completedEvent))

    expect(res.status).toBe(200)
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: "order1", status: "PENDING" },
      data:  { status: "PAID" },
    })
    expect(sendOrderConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(forwardOrderToCJ).toHaveBeenCalledWith("order1")
  })

  it("is idempotent: skips already-processed orders without re-forwarding to CJ", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(completedEvent as any)
    vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 0 })

    const res = await POST(makeRequest(completedEvent))

    expect(res.status).toBe(200)
    expect(prisma.order.findUniqueOrThrow).not.toHaveBeenCalled()
    expect(forwardOrderToCJ).not.toHaveBeenCalled()
  })

  it("ignores events without an orderId in metadata", async () => {
    const eventWithoutOrderId = { type: "checkout.session.completed", data: { object: { metadata: {} } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(eventWithoutOrderId as any)

    const res = await POST(makeRequest(eventWithoutOrderId))

    expect(res.status).toBe(200)
    expect(prisma.order.updateMany).not.toHaveBeenCalled()
  })
})
