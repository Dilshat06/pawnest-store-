import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { paypal } from "@/lib/paypal"
import { forwardOrderToCJ } from "@/lib/order-fulfillment"
import { sendOrderConfirmationEmail, sendAdminAlertEmail } from "@/lib/email"

// Капчур PayPal-заказа + создание заказа в CJ может не успеть за дефолтный таймаут Vercel
export const maxDuration = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

// GET /api/paypal/capture — клиент возвращается сюда после подтверждения оплаты в PayPal.
// PayPal сам добавляет к нашему return_url параметр ?token=<paypalOrderId>&PayerID=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId       = searchParams.get("orderId")
  const paypalOrderId = searchParams.get("token")

  if (!orderId || !paypalOrderId) {
    return NextResponse.redirect(`${SITE_URL}/cart`)
  }

  try {
    const existing = await prisma.order.findUnique({ where: { id: orderId } })

    // paypalOrderId из URL должен совпадать с тем, что мы сохранили для ЭТОГО
    // заказа при создании — иначе можно было бы подменить заказ чужой оплатой
    if (!existing || existing.paypalOrderId !== paypalOrderId) {
      return NextResponse.redirect(`${SITE_URL}/cart`)
    }

    // Уже обработан (повторный заход на ссылку, обновление страницы и т.п.)
    if (existing.status !== "PENDING") {
      return NextResponse.redirect(`${SITE_URL}/order-success?orderId=${existing.id}&token=${existing.accessToken}`)
    }

    const capture = await paypal.captureOrder(paypalOrderId)
    if (capture.status !== "COMPLETED") {
      throw new Error(`PayPal capture status: ${capture.status}`)
    }

    // Идемпотентно переводим в PAID — гарантирует, что повторный заход на эту
    // ссылку (или параллельный вызов из /api/webhook/paypal) не задвоит обработку
    const { count } = await prisma.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data:  { status: "PAID" },
    })

    if (count === 1) {
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
      }).catch((err) => console.error("[PayPal capture] Email error:", err))

      try {
        await forwardOrderToCJ(orderId)
      } catch (error) {
        console.error(`[PayPal capture] Ошибка отправки заказа ${orderId} в CJ:`, error)
        await sendAdminAlertEmail({
          subject: `Order ${orderId} did not reach CJ`,
          message: `Order ${orderId} was paid via PayPal but failed to forward to CJ Dropshipping. It will be retried automatically by the sync-orders cron, or you can retry it manually from /admin/orders. Error: ${error instanceof Error ? error.message : String(error)}`,
        }).catch((err) => console.error("[PayPal capture] Alert email error:", err))
      }
    }

    return NextResponse.redirect(`${SITE_URL}/order-success?orderId=${existing.id}&token=${existing.accessToken}`)
  } catch (error) {
    console.error(`[GET /api/paypal/capture] Заказ ${orderId}:`, error)
    return NextResponse.redirect(`${SITE_URL}/cart?error=payment_failed`)
  }
}
