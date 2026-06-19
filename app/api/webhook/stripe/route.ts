import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { cj } from "@/lib/cj"
import { sendOrderConfirmationEmail } from "@/lib/email"
import Stripe from "stripe"

// Stripe шлёт сюда события — оплата прошла, отменена и т.д.
export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Нет подписи" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("[Webhook] Неверная подпись:", err)
    return NextResponse.json({ error: "Неверная подпись" }, { status: 400 })
  }

  // Обрабатываем только успешную оплату
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (!orderId) {
      console.error("[Webhook] orderId не найден в metadata")
      return NextResponse.json({ error: "orderId не найден" }, { status: 400 })
    }

    try {
      // Обновляем статус заказа на PAID
      const order = await prisma.order.update({
        where: { id: orderId },
        data:  { status: "PAID" },
        include: {
          items: {
            include: {
              variant: true,
              product: { select: { title: true, variants: true } },
            }
          }
        },
      })

      // Письмо-подтверждение покупателю
      await sendOrderConfirmationEmail({
        to:           order.customerEmail,
        orderId:      order.id,
        customerName: order.customerName,
        total:        order.totalPrice,
        items: order.items.map((item) => ({
          title:    item.product.title,
          quantity: item.quantity,
          price:    item.price,
        })),
      }).catch((err) => console.error("[Webhook] Email error:", err))

      // Отправляем заказ в CJ Dropshipping
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

      if (cjProducts.length > 0) {
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

      console.log(`[Webhook] Заказ ${orderId} успешно обработан`)
    } catch (error) {
      console.error(`[Webhook] Ошибка обработки заказа ${orderId}:`, error)
      // Не возвращаем ошибку — Stripe будет повторять запрос
    }
  }

  return NextResponse.json({ received: true })
}
