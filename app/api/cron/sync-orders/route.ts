import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cj } from "@/lib/cj"
import { sendShippingNotificationEmail } from "@/lib/email"

// GET /api/cron/sync-orders — проверяет статус заказов в CJ, обновляет трек-номер и статус доставки
// Защищён секретом, вызывается планировщиком раз в несколько часов
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: {
      cjOrderId: { not: null },
      status:    { in: ["PROCESSING", "SHIPPED"] },
    },
  })

  const results: { orderId: string; status: string }[] = []

  for (const order of orders) {
    try {
      const detail = await cj.getOrderStatus(order.cjOrderId!)
      const data    = detail.data

      if (!data) {
        results.push({ orderId: order.id, status: "not_found_in_cj" })
        continue
      }

      const trackingNumber: string | undefined = data.trackNumber ?? data.trackingNumber
      const cjStatus: string | undefined        = data.orderStatus ?? data.status

      const wasShippedBefore = order.status === "SHIPPED"
      let newStatus = order.status

      if (cjStatus === "DELIVERED" || cjStatus === "Delivered") {
        newStatus = "DELIVERED"
      } else if (trackingNumber) {
        newStatus = "SHIPPED"
      }

      if (newStatus !== order.status || (trackingNumber && trackingNumber !== order.trackingNumber)) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status:         newStatus,
            trackingNumber: trackingNumber ?? order.trackingNumber,
          },
        })

        // Письмо с трек-номером отправляем один раз — в момент первого появления статуса SHIPPED
        if (newStatus === "SHIPPED" && !wasShippedBefore && trackingNumber) {
          await sendShippingNotificationEmail({
            to:             order.customerEmail,
            orderId:        order.id,
            customerName:   order.customerName,
            trackingNumber,
          }).catch((err) => console.error("[sync-orders] Email error:", err))
        }
      }

      results.push({ orderId: order.id, status: "updated" })
    } catch (error) {
      console.error(`[sync-orders] Ошибка для заказа ${order.id}:`, error)
      results.push({ orderId: order.id, status: "error" })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}
