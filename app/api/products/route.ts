import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// GET /api/products — список товаров с фильтрацией и пагинацией
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page     = Math.max(1, Number(searchParams.get("page") ?? 1))
    const limit    = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 12)))
    const category = searchParams.get("category") ?? undefined
    const search   = searchParams.get("search") ?? undefined

    const where = {
      isActive: true,
      ...(category && { category }),
      ...(search && {
        title: { contains: search, mode: "insensitive" as const },
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          category: true,
          stock: true,
        },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[GET /api/products]", error)
    return NextResponse.json({ error: "Ошибка получения товаров" }, { status: 500 })
  }
}

// POST /api/products — добавить товар (только для импорта из CJ)
const CreateProductSchema = z.object({
  cjProductId: z.string().min(1),
  title:       z.string().min(1),
  description: z.string(),
  price:       z.number().positive(),
  costPrice:   z.number().positive(),
  images:      z.array(z.string().url()),
  category:    z.string().min(1),
  stock:       z.number().int().min(0).default(0),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CreateProductSchema.parse(body)

    const product = await prisma.product.upsert({
      where:  { cjProductId: data.cjProductId },
      update: data,
      create: data,
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("[POST /api/products]", error)
    return NextResponse.json({ error: "Ошибка создания товара" }, { status: 500 })
  }
}
