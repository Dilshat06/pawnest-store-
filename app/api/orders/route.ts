import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { z } from "zod"

const AddressSchema = z.object({
  name:        z.string().min(1),
  phone:       z.string().min(1),
  countryCode: z.string().length(2), // ISO-код, нужен для CJ Dropshipping
  country:     z.string().min(2),
  province:    z.string().min(1),
  city:        z.string().min(1),
  address:     z.string().min(1),
  zipCode:     z.string().min(1),
})

const OrderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity:  z.number().int().positive(),
})

const CreateOrderSchema = z.object({
  customerEmail: z.string().email(),
  customerName:  z.string().min(1),
  address:       AddressSchema,
  items:         z.array(OrderItemSchema).min(1),
})

// POST /api/orders — создать заказ и получить PayPal ссылку на оплату
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateOrderSchema.parse(body)

    // Получаем товары из БД
    const productIds = data.items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { variants: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Один или несколько товаров не найдены" }, { status: 400 })
    }

    // Проверяем остаток на складе перед оплатой
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId)!
      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : null

      if (item.variantId && !variant) {
        return NextResponse.json({ error: `Вариант товара не найден: ${product.title}` }, { status: 400 })
      }

      const availableStock = variant ? variant.stock : product.stock
      if (availableStock < item.quantity) {
        return NextResponse.json({ error: `Недостаточно товара на складе: ${product.title}` }, { status: 400 })
      }
    }

    // Считаем итоговую сумму
    let totalPrice = 0
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!
      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : null
      const price = variant ? variant.price : product.price
      totalPrice += price * item.quantity

      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity:  item.quantity,
        price,
      }
    })

    // Создаём заказ в БД со статусом PENDING. accessToken — случайный секрет
    // для безпарольной страницы статуса заказа (ссылка приходит в письме)
    const order = await prisma.order.create({
      data: {
        customerEmail: data.customerEmail,
        customerName:  data.customerName,
        address:       data.address,
        totalPrice,
        accessToken: randomBytes(24).toString("hex"),
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    })

    // Создаём Stripe Checkout Session. Заказ помечается PAID только по
    // вебхуку checkout.session.completed — см. /api/webhook/stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: data.customerEmail,
      line_items: order.items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name:   item.product.title,
            images: item.product.images.slice(0, 1),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      metadata: { orderId: order.id },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?orderId=${order.id}&token=${order.accessToken}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
    })

    if (!session.url) {
      throw new Error("Stripe не вернул checkout URL")
    }

    await prisma.order.update({
      where: { id: order.id },
      data:  { stripePaymentId: session.id },
    })

    return NextResponse.json({ orderId: order.id, checkoutUrl: session.url }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("[POST /api/orders]", error)
    return NextResponse.json({ error: "Ошибка создания заказа" }, { status: 500 })
  }
}
