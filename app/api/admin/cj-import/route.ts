import { NextRequest, NextResponse } from "next/server"
import { cj } from "@/lib/cj"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Запрос деталей товара + параллельные запросы остатков по каждому варианту
// могут не успеть за дефолтный таймаут Vercel для товаров с большим числом вариантов
export const maxDuration = 60

const ImportSchema = z.object({
  cjProductId: z.string().min(1),
  category:    z.string().min(1),
  markup:      z.number().min(1).default(2), // множитель наценки от цены закупки
})

// POST /api/admin/cj-import — импортировать товар из CJ в свою базу
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cjProductId, category, markup } = ImportSchema.parse(body)

    const detail = await cj.getProductDetail(cjProductId)
    const data   = detail.data

    if (!data) {
      return NextResponse.json({ error: "Товар не найден в CJ" }, { status: 404 })
    }

    const costPrice = Number(data.sellPrice ?? 0)
    const price     = Math.round(costPrice * markup * 100) / 100

    const images: string[] = Array.isArray(data.productImageSet)
      ? data.productImageSet
      : [data.productImage].filter(Boolean)

    const rawVariants: Record<string, unknown>[] = Array.isArray(data.variants) ? data.variants : []

    // Запрашиваем реальные остатки на складе для каждого варианта параллельно
    const stocks = await Promise.all(
      rawVariants.map((v) => cj.getVariantStock(String(v.vid)).catch(() => 0))
    )

    // Товары, отгружаемые напрямую поставщиком, не имеют склада в CJ —
    // нулевой остаток в этом случае не значит "нет в наличии"
    const isSupplierShipped = data.productType === "SUPPLIER_SHIPPED_PRODUCT"
    const FALLBACK_STOCK = 999

    const variants = rawVariants.map((v, i) => ({
      name:  String(v.variantNameEn || v.variantKey || v.variantName || "Default"),
      sku:   String(v.vid),
      price: Math.round(Number(v.variantSellPrice ?? costPrice) * markup * 100) / 100,
      stock: stocks[i] > 0 ? stocks[i] : (isSupplierShipped ? FALLBACK_STOCK : 0),
    }))

    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0)

    const product = await prisma.product.upsert({
      where: { cjProductId },
      update: {
        title:       data.productNameEn ?? data.productName,
        description: data.description ?? "",
        price,
        costPrice,
        images,
        videoUrl: data.productVideo || null,
        category,
        stock: totalStock,
      },
      create: {
        cjProductId,
        title:       data.productNameEn ?? data.productName,
        description: data.description ?? "",
        price,
        costPrice,
        images,
        videoUrl: data.productVideo || null,
        category,
        stock: totalStock,
      },
    })

    // Пересоздаём варианты товара
    if (variants.length > 0) {
      await prisma.variant.deleteMany({ where: { productId: product.id } })
      await prisma.variant.createMany({
        data: variants.map((v) => ({ ...v, productId: product.id })),
      })
    }

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("[POST /api/admin/cj-import]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка импорта товара" },
      { status: 500 }
    )
  }
}
