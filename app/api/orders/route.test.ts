import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    order:   { create: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/lib/paypal", () => ({
  paypal: {
    createOrder: vi.fn(),
  },
}))

import { prisma } from "@/lib/prisma"
import { paypal } from "@/lib/paypal"
import { POST } from "./route"

const validBody = {
  customerEmail: "jane@example.com",
  customerName:  "Jane Doe",
  address: {
    name: "Jane Doe", phone: "+1 555 0000", countryCode: "US", country: "United States",
    province: "NY", city: "New York", address: "123 Main St", zipCode: "10001",
  },
  items: [{ productId: "prod1", variantId: null, quantity: 3 }],
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/orders", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  })
}

describe("POST /api/orders stock validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects when requested quantity exceeds product stock", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod1", title: "Dog Bed", price: 20, stock: 2, variants: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any)

    const res  = await POST(makeRequest(validBody))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toMatch(/Недостаточно товара/)
    expect(prisma.order.create).not.toHaveBeenCalled()
  })

  it("rejects when requested quantity exceeds the selected variant's stock", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: "prod1", title: "Dog Bed", price: 20, stock: 99,
        variants: [{ id: "var1", price: 22, stock: 1 }],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any)

    const res  = await POST(makeRequest({ ...validBody, items: [{ productId: "prod1", variantId: "var1", quantity: 3 }] }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toMatch(/Недостаточно товара/)
    expect(prisma.order.create).not.toHaveBeenCalled()
  })

  it("creates the order and a PayPal order when stock is sufficient", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod1", title: "Dog Bed", price: 20, stock: 10, variants: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any)
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: "order1", accessToken: "tok", totalPrice: 60,
      items: [{ price: 20, quantity: 3, product: { title: "Dog Bed", images: [] } }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(paypal.createOrder).mockResolvedValue({
      id: "paypal-order-1",
      links: [{ rel: "approve", href: "https://paypal.test/approve" }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const res  = await POST(makeRequest(validBody))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.approveUrl).toBe("https://paypal.test/approve")
    expect(prisma.order.create).toHaveBeenCalledTimes(1)
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order1" },
      data:  { paypalOrderId: "paypal-order-1" },
    })
  })

  it("fails when PayPal doesn't return an approve link", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod1", title: "Dog Bed", price: 20, stock: 10, variants: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any)
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: "order1", accessToken: "tok", totalPrice: 60,
      items: [{ price: 20, quantity: 3, product: { title: "Dog Bed", images: [] } }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(paypal.createOrder).mockResolvedValue({ id: "paypal-order-1", links: [] } as any)

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(500)
    expect(prisma.order.update).not.toHaveBeenCalled()
  })
})
