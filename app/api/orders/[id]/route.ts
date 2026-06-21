import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/orders/[id]?token=... — статус заказа для клиента по беспарольной
// ссылке из письма. Требует совпадения accessToken — без него ничего не отдаём
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = new URL(req.url).searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Токен обязателен" }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: { select: { name: true } },
            product: { select: { title: true, images: true } },
          },
        },
      },
    })

    if (!order || order.accessToken !== token) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 })
    }

    const { accessToken, ...safeOrder } = order
    void accessToken

    return NextResponse.json(safeOrder)
  } catch (error) {
    console.error("[GET /api/orders/[id]]", error)
    return NextResponse.json({ error: "Ошибка получения заказа" }, { status: 500 })
  }
}
