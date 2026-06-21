import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"

const COOKIE_NAME = "cart_session"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 дней

// Только читает сессионную куку — не создаёт её. Для GET-запросов,
// чтобы случайный заход на сайт не плодил пустые строки Cart в БД
async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export async function getCart() {
  const sessionId = await getSessionId()
  if (!sessionId) return null
  return prisma.cart.findUnique({ where: { sessionId } })
}

// Создаёт куку и строку Cart при первом добавлении товара в корзину
export async function getOrCreateCart() {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(COOKIE_NAME)?.value

  if (!sessionId) {
    sessionId = randomBytes(16).toString("hex")
    cookieStore.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })
  }

  return prisma.cart.upsert({
    where:  { sessionId },
    update: {},
    create: { sessionId },
  })
}

// Цена и остаток всегда берутся свежими из Product/Variant, а не кешируются
// в CartItem — иначе корзина может показывать устаревшую цену/наличие
export async function getCartItemsForResponse(cartId: string) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: { select: { title: true, images: true, price: true, stock: true } },
      variant: { select: { id: true, name: true, price: true, stock: true } },
    },
    orderBy: { id: "asc" },
  })

  return items.map((item) => ({
    id:          item.id,
    productId:   item.productId,
    variantId:   item.variantId,
    title:       item.product.title,
    variantName: item.variant?.name ?? null,
    price:       item.variant?.price ?? item.product.price,
    stock:       item.variant?.stock ?? item.product.stock,
    image:       item.product.images[0] ?? "",
    quantity:    item.quantity,
  }))
}
