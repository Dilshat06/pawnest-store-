import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCart, getOrCreateCart, getCartItemsForResponse } from "@/lib/cart-session"
import { z } from "zod"

// GET /api/cart — текущая корзина по сессионной куке
export async function GET() {
  try {
    const cart = await getCart()
    if (!cart) return NextResponse.json({ items: [] })

    const items = await getCartItemsForResponse(cart.id)
    return NextResponse.json({ items })
  } catch (error) {
    console.error("[GET /api/cart]", error)
    return NextResponse.json({ error: "Ошибка получения корзины" }, { status: 500 })
  }
}

const AddItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity:  z.number().int().positive().default(1),
})

// POST /api/cart — добавить товар (увеличивает количество, если уже есть)
export async function POST(req: NextRequest) {
  try {
    const data = AddItemSchema.parse(await req.json())

    const product = await prisma.product.findFirst({
      where:   { id: data.productId, isActive: true },
      include: { variants: true },
    })
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 })
    }

    const variantId = data.variantId ?? null
    if (variantId && !product.variants.some((v) => v.id === variantId)) {
      return NextResponse.json({ error: "Вариант не найден" }, { status: 404 })
    }

    const cart = await getOrCreateCart()

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: data.productId, variantId },
    })

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data:  { quantity: existing.quantity + data.quantity },
      })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: data.productId, variantId, quantity: data.quantity },
      })
    }

    const items = await getCartItemsForResponse(cart.id)
    return NextResponse.json({ items }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("[POST /api/cart]", error)
    return NextResponse.json({ error: "Ошибка добавления в корзину" }, { status: 500 })
  }
}

// DELETE /api/cart — очистить всю корзину (после успешного оформления заказа)
export async function DELETE() {
  try {
    const cart = await getCart()
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }
    return NextResponse.json({ items: [] })
  } catch (error) {
    console.error("[DELETE /api/cart]", error)
    return NextResponse.json({ error: "Ошибка очистки корзины" }, { status: 500 })
  }
}
