import { NextRequest, NextResponse } from "next/server"
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

// POST /api/orders — создать заказ и получить Stripe ссылку на оплату
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

    // Создаём заказ в БД со статусом PENDING
    const order = await prisma.order.create({
      data: {
        customerEmail: data.customerEmail,
        customerName:  data.customerName,
        address:       data.address,
        totalPrice,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    })

    // Создаём Stripe Checkout Session
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
          unit_amount: Math.round(item.price * 100), // в центах
        },
        quantity: item.quantity,
      })),
      metadata: { orderId: order.id },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?orderId=${order.id}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
    })

    // Сохраняем Stripe Payment ID
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

// GET /api/orders?email=... — получить заказы покупателя
export async function GET(req: NextRequest) {
  try {
    const email = new URL(req.url).searchParams.get("email")
    if (!email) {
      return NextResponse.json({ error: "Email обязателен" }, { status: 400 })
    }

    const orders = await prisma.order.findMany({
      where:   { customerEmail: email },
      include: { items: { include: { product: { select: { title: true, images: true } } } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("[GET /api/orders]", error)
    return NextResponse.json({ error: "Ошибка получения заказов" }, { status: 500 })
  }
}
