import { NextRequest, NextResponse } from "next/server"
import { cj } from "@/lib/cj"

// GET /api/admin/cj-search?keyword=dog+bed&page=1 — поиск товаров в CJ для импорта
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get("keyword")
    const page    = Math.max(1, Number(searchParams.get("page") ?? 1))

    if (!keyword) {
      return NextResponse.json({ error: "Параметр keyword обязателен" }, { status: 400 })
    }

    const data = await cj.searchProducts(keyword, page, 20)

    const list = data.data?.list ?? []
    const products = list.map((p: Record<string, unknown>) => ({
      cjProductId: p.pid,
      title:       p.productNameEn ?? p.productName,
      image:       p.productImage,
      price:       Number(p.sellPrice ?? 0),
      category:    p.categoryName,
    }))

    return NextResponse.json({
      products,
      total: data.data?.total ?? 0,
      page,
    })
  } catch (error) {
    console.error("[GET /api/admin/cj-search]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка поиска товаров в CJ" },
      { status: 500 }
    )
  }
}
