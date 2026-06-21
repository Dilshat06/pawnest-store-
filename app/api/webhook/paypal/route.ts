import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { paypal } from "@/lib/paypal"
import { forwardOrderToCJ } from "@/lib/order-fulfillment"
import { sendOrderConfirmationEmail, sendAdminAlertEmail } from "@/lib/email"

// Капчур уже произошёл к моменту этого события — здесь только дозавершаем заказ
export const maxDuration = 60

// POST /api/webhook/paypal — резервный путь на случай, если клиент не вернулся
// на /api/paypal/capture (например закрыл вкладку сразу после одобрения оплаты).
// Основной путь обработки оплаты — capture при возврате клиента с PayPal.
export async function POST(req: NextRequest) {
  const body  = await req.text()
  const event = JSON.parse(body)

  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    console.error("[PayPal webhook] PAYPAL_WEBHOOK_ID не настроен")
    return NextResponse.json({ error: "Webhook не настроен" }, { status: 500 })
  }

  const verified = await paypal.verifyWebhookSignature({
    transmissionId:   req.headers.get("paypal-transmission-id") ?? "",
    transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
    certUrl:          req.headers.get("paypal-cert-url") ?? "",
    authAlgo:         req.headers.get("paypal-auth-algo") ?? "",
    transmissionSig:  req.headers.get("paypal-transmission-sig") ?? "",
    webhookId,
    webhookEvent: event,
  }).catch((err) => {
    console.error("[PayPal webhook] Ошибка проверки подписи:", err)
    return false
  })

  if (!verified) {
    console.error("[PayPal webhook] Неверная подпись")
    return NextResponse.json({ error: "Неверная подпись" }, { status: 400 })
  }

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const resource             = event.resource
    const orderId: string | undefined        = resource?.custom_id
    const paypalOrderId: string | undefined  = resource?.supplementary_data?.related_ids?.order_id

    if (!orderId) {
      console.error("[PayPal webhook] custom_id (orderId) не найден в событии")
      return NextResponse.json({ received: true })
    }

    try {
      const existing = await prisma.order.findUnique({ where: { id: orderId } })

      // paypalOrderId должен совпадать с сохранённым для этого заказа —
      // та же защита от подмены, что и в /api/paypal/capture
      if (!existing || (paypalOrderId && existing.paypalOrderId !== paypalOrderId)) {
        console.error(`[PayPal webhook] Заказ ${orderId} не найден или paypalOrderId не совпадает`)
        return NextResponse.json({ received: true })
      }

      // Идемпотентно: если capture-роут уже обработал заказ — count будет 0
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
      }).catch((err) => console.error("[PayPal webhook] Email error:", err))

      try {
        await forwardOrderToCJ(orderId)
      } catch (error) {
        console.error(`[PayPal webhook] Ошибка отправки заказа ${orderId} в CJ:`, error)
        await sendAdminAlertEmail({
          subject: `Order ${orderId} did not reach CJ`,
          message: `Order ${orderId} was paid via PayPal (webhook path) but failed to forward to CJ Dropshipping. It will be retried automatically by the sync-orders cron, or you can retry it manually from /admin/orders. Error: ${error instanceof Error ? error.message : String(error)}`,
        }).catch((err) => console.error("[PayPal webhook] Alert email error:", err))
      }
    } catch (error) {
      console.error(`[PayPal webhook] Ошибка обработки заказа ${orderId}:`, error)
    }
  }

  return NextResponse.json({ received: true })
}
