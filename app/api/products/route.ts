import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
