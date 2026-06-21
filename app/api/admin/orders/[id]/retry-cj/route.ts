import { NextRequest, NextResponse } from "next/server"
import { forwardOrderToCJ } from "@/lib/order-fulfillment"

// POST /api/admin/orders/[id]/retry-cj — ручная повторная отправка заказа в CJ
// (для заказов, зависших на PAID без cjOrderId). Защищён proxy.ts
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await forwardOrderToCJ(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[POST /api/admin/orders/${id}/retry-cj]`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка отправки в CJ" },
      { status: 500 }
    )
  }
}
