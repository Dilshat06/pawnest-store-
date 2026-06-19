import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import sanitizeHtml from "sanitize-html"

// GET /api/products/[id] — детальная страница товара
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 })
    }

    // Описание от CJ приходит как HTML — очищаем от опасных тегов/скриптов перед отдачей на клиент
    const safeDescription = sanitizeHtml(product.description, {
      allowedTags: ["p", "b", "strong", "i", "em", "br", "ul", "ol", "li", "h3", "h4", "img", "span"],
      allowedAttributes: { img: ["src", "alt"] },
    })

    return NextResponse.json({ ...product, description: safeDescription })
  } catch (error) {
    console.error("[GET /api/products/[id]]", error)
    return NextResponse.json({ error: "Ошибка получения товара" }, { status: 500 })
  }
}
