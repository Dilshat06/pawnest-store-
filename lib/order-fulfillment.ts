import { prisma } from "@/lib/prisma"
import { cj } from "@/lib/cj"

// Отправляет оплаченный заказ в CJ Dropshipping. Безопасно вызывать повторно —
// если cjOrderId уже есть, ничего не делает (используется и вебхуком, и cron-ретраем).
export async function forwardOrderToCJ(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: true,
          product: { select: { variants: true } },
        },
      },
    },
  })

  if (order.cjOrderId) return

  const address = order.address as {
    name: string; phone: string; countryCode: string; country: string
    province: string; city: string; address: string; zipCode: string
  }

  // Если вариант не был указан при заказе — берём первый доступный SKU товара
  const cjProducts = order.items
    .map((item) => ({
      vid:      item.variant?.sku ?? item.product.variants[0]?.sku,
      quantity: item.quantity,
    }))
    .filter((item): item is { vid: string; quantity: number } => Boolean(item.vid))

  if (cjProducts.length === 0) return

  const cjResponse = await cj.createOrder({
    orderId:  order.id,
    products: cjProducts,
    address,
  })

  // CJ возвращает ID созданного заказа прямо в поле data (строка)
  const cjOrderId: string | undefined = cjResponse.data
  if (cjOrderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        cjOrderId,
        status: "PROCESSING",
      },
    })
  }
}
