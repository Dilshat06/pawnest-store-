import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCart, getCartItemsForResponse } from "@/lib/cart-session"
import { z } from "zod"

const UpdateSchema = z.object({ quantity: z.number().int().positive() })

// PATCH /api/cart/[itemId] — изменить количество товара в своей корзине
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const { quantity } = UpdateSchema.parse(await req.json())

    const cart = await getCart()
    if (!cart) {
      return NextResponse.json({ error: "Корзина не найдена" }, { status: 404 })
    }

    // cartId в where гарантирует, что нельзя поменять чужой товар, подобрав itemId
    const { count } = await prisma.cartItem.updateMany({
      where: { id: itemId, cartId: cart.id },
      data:  { quantity },
    })
    if (count === 0) {
      return NextResponse.json({ error: "Товар не найден в корзине" }, { status: 404 })
    }

    const items = await getCartItemsForResponse(cart.id)
    return NextResponse.json({ items })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("[PATCH /api/cart/[itemId]]", error)
    return NextResponse.json({ error: "Ошибка обновления корзины" }, { status: 500 })
  }
}

// DELETE /api/cart/[itemId] — удалить товар из своей корзины
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const cart = await getCart()
    if (!cart) {
      return NextResponse.json({ error: "Корзина не найдена" }, { status: 404 })
    }

    await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } })

    const items = await getCartItemsForResponse(cart.id)
    return NextResponse.json({ items })
  } catch (error) {
    console.error("[DELETE /api/cart/[itemId]]", error)
    return NextResponse.json({ error: "Ошибка удаления из корзины" }, { status: 500 })
  }
}
