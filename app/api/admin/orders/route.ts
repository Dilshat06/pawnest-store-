import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/admin/orders — список заказов для админки (защищён proxy.ts)
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id:             true,
        status:         true,
        customerName:   true,
        customerEmail:  true,
        totalPrice:     true,
        cjOrderId:      true,
        trackingNumber: true,
        createdAt:      true,
        items: {
          select: {
            quantity: true,
            product:  { select: { title: true } },
          },
        },
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[GET /api/admin/orders]", error)
    return NextResponse.json({ error: "Ошибка получения заказов" }, { status: 500 })
  }
}
