import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUniqueOrThrow: vi.fn(),
      update:            vi.fn(),
    },
  },
}))

vi.mock("@/lib/cj", () => ({
  cj: {
    createOrder: vi.fn(),
  },
}))

import { prisma } from "@/lib/prisma"
import { cj } from "@/lib/cj"
import { forwardOrderToCJ } from "@/lib/order-fulfillment"

const baseAddress = {
  name: "Jane", phone: "123", countryCode: "US", country: "United States",
  province: "NY", city: "NYC", address: "123 Main St", zipCode: "10001",
}

describe("forwardOrderToCJ", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does nothing if the order already has a cjOrderId", async () => {
    vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
      id: "order1", cjOrderId: "cj-existing", address: baseAddress, items: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await forwardOrderToCJ("order1")

    expect(cj.createOrder).not.toHaveBeenCalled()
    expect(prisma.order.update).not.toHaveBeenCalled()
  })

  it("does nothing if no item has a resolvable CJ sku", async () => {
    vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
      id: "order1", cjOrderId: null, address: baseAddress,
      items: [{ quantity: 1, variant: null, product: { variants: [] } }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await forwardOrderToCJ("order1")

    expect(cj.createOrder).not.toHaveBeenCalled()
  })

  it("creates the CJ order and saves cjOrderId + PROCESSING on success", async () => {
    vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
      id: "order1", cjOrderId: null, address: baseAddress,
      items: [{ quantity: 2, variant: { sku: "sku-123" }, product: { variants: [] } }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(cj.createOrder).mockResolvedValue({ data: "cj-order-789" } as any)

    await forwardOrderToCJ("order1")

    expect(cj.createOrder).toHaveBeenCalledWith({
      orderId:  "order1",
      products: [{ vid: "sku-123", quantity: 2 }],
      address:  baseAddress,
    })
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order1" },
      data:  { cjOrderId: "cj-order-789", status: "PROCESSING" },
    })
  })

  it("falls back to the product's first variant sku when the order item has no variant", async () => {
    vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
      id: "order1", cjOrderId: null, address: baseAddress,
      items: [{ quantity: 1, variant: null, product: { variants: [{ sku: "fallback-sku" }] } }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(cj.createOrder).mockResolvedValue({ data: "cj-order-1" } as any)

    await forwardOrderToCJ("order1")

    expect(cj.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ products: [{ vid: "fallback-sku", quantity: 1 }] })
    )
  })
})
