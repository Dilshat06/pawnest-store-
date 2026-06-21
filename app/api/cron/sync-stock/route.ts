import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cj } from "@/lib/cj"

// Цикл по товарам с CJ-запросами на каждый может не успеть за дефолтный таймаут Vercel
export const maxDuration = 60

// GET /api/cron/sync-stock — обновляет остатки и закупочные цены всех импортированных товаров из CJ
// Защищён секретом, вызывается планировщиком (Vercel Cron / внешний cron) раз в день
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
  })

  const results: { productId: string; status: string }[] = []

  for (const product of products) {
    try {
      const detail = await cj.getProductDetail(product.cjProductId)
      const data    = detail.data
      if (!data) {
        results.push({ productId: product.id, status: "not_found_in_cj" })
        continue
      }

      const newCostPrice = Number(data.sellPrice ?? product.costPrice)
      const markup        = product.costPrice > 0 ? product.price / product.costPrice : 2
      const newPrice       = Math.round(newCostPrice * markup * 100) / 100

      const isSupplierShipped = data.productType === "SUPPLIER_SHIPPED_PRODUCT"
      const rawVariants: Record<string, unknown>[] = Array.isArray(data.variants) ? data.variants : []

      let totalStock = 0
      for (const v of rawVariants) {
        const vid   = String(v.vid)
        const stock = await cj.getVariantStock(vid).catch(() => 0)
        const finalStock = stock > 0 ? stock : (isSupplierShipped ? 999 : 0)
        totalStock += finalStock

        await prisma.variant.updateMany({
          where: { sku: vid, productId: product.id },
          data:  { stock: finalStock },
        })
      }

      await prisma.product.update({
        where: { id: product.id },
        data: {
          costPrice: newCostPrice,
          price:     newPrice,
          stock:     totalStock,
        },
      })

      results.push({ productId: product.id, status: "updated" })
    } catch (error) {
      console.error(`[sync-stock] Ошибка для товара ${product.id}:`, error)
      results.push({ productId: product.id, status: "error" })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}
