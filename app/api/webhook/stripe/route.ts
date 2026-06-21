import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { forwardOrderToCJ } from "@/lib/order-fulfillment"
import { sendOrderConfirmationEmail, sendAdminAlertEmail } from "@/lib/email"
import Stripe from "stripe"

// Отправка заказа в CJ Dropshipping может не успеть за дефолтный таймаут Vercel
export const maxDuration = 60

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
    console.error("[Stripe webhook] Неверная подпись:", err)
    return NextResponse.json({ error: "Неверная подпись" }, { status: 400 })
  }

  // Обрабатываем только успешную оплату
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (!orderId) {
      console.error("[Stripe webhook] orderId не найден в metadata")
      return NextResponse.json({ received: true })
    }

    try {
      // Идемпотентно переводим в PAID — повторная доставка того же события
      // Stripe (retry) не должна задвоить письмо и заказ в CJ
      const { count } = await prisma.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data:  { status: "PAID" },
      })

      if (count === 0) {
        return NextResponse.json({ received: true })
      }

      const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: { include: { product: { select: { title: true } } } } },
      })

      await sendOrderConfirmationEmail({
        to:           order.customerEmail,
        orderId:      order.id,
        accessToken:  order.accessToken,
        customerName: order.customerName,
        total:        order.totalPrice,
        items: order.items.map((item) => ({
          title:    item.product.title,
          quantity: item.quantity,
          price:    item.price,
        })),
      }).catch((err) => console.error("[Stripe webhook] Email error:", err))

      try {
        await forwardOrderToCJ(orderId)
      } catch (error) {
        console.error(`[Stripe webhook] Ошибка отправки заказа ${orderId} в CJ:`, error)
        await sendAdminAlertEmail({
          subject: `Order ${orderId} did not reach CJ`,
          message: `Order ${orderId} was paid via Stripe but failed to forward to CJ Dropshipping. It will be retried automatically by the sync-orders cron, or you can retry it manually from /admin/orders. Error: ${error instanceof Error ? error.message : String(error)}`,
        }).catch((err) => console.error("[Stripe webhook] Alert email error:", err))
      }

      console.log(`[Stripe webhook] Заказ ${orderId} успешно обработан`)
    } catch (error) {
      console.error(`[Stripe webhook] Ошибка обработки заказа ${orderId}:`, error)
    }
  }

  return NextResponse.json({ received: true })
}
