import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import SearchForm from "@/components/SearchForm"
import ShopHeader from "@/components/ShopHeader"
import FooterSection from "@/components/landing/FooterSection"

interface Props {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>
}

async function getProducts(page: number, category?: string, search?: string) {
  const limit = 12
  const where = {
    isActive: true,
    ...(category && { category }),
    ...(search && { title: { contains: search, mode: "insensitive" as const } }),
  }
  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: "desc" },
      select:  { id: true, title: true, price: true, images: true, category: true, stock: true },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where:    { isActive: true },
      select:   { category: true },
      distinct: ["category"],
    }),
  ])
  return { products, total, pages: Math.ceil(total / limit), categories: categories.map((c) => c.category) }
}

export default async function ProductsPage({ searchParams }: Props) {
  const params   = await searchParams
  const page     = Math.max(1, Number(params.page ?? 1))
  const category = params.category
  const search   = params.search

  const { products, total, pages, categories } = await getProducts(page, category, search)

  return (
    <div className="bg-cream min-h-screen">
      <ShopHeader />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">Shop All</p>
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-text mb-10">
          Essentials for <span className="italic text-primary">Happier Pets</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Фильтры */}
          <aside className="w-full lg:w-56 shrink-0">
            <div className="bg-card rounded-2xl border border-text/10 p-5 shadow-sm">
              <h2 className="font-playfair font-semibold text-text mb-4 tracking-wide">Categories</h2>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/products"
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!category ? "bg-primary/10 text-primary font-medium" : "text-text/60 hover:bg-text/5"}`}
                  >
                    All Products ({total})
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/products?category=${encodeURIComponent(cat)}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${category === cat ? "bg-primary/10 text-primary font-medium" : "text-text/60 hover:bg-text/5"}`}
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Товары */}
          <div className="flex-1">
            <SearchForm defaultValue={search} />

            {products.length === 0 ? (
              <div className="text-center py-24 text-text/40">
                <p className="text-5xl mb-4">🐾</p>
                <p className="text-lg font-playfair">No products found yet</p>
                <p className="text-sm mt-2">Check back soon — new essentials are on the way.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden border border-text/10 hover:border-primary/30"
                    >
                      <div className="relative aspect-square bg-cream">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-4xl text-text/20">🐾</div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-darkbrown/50 flex items-center justify-center">
                            <span className="bg-cream text-text text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-primary font-medium mb-1 tracking-wide uppercase">{product.category}</p>
                        <h3 className="font-semibold text-text text-sm line-clamp-2 mb-2">{product.title}</h3>
                        <p className="text-primary font-bold">${product.price.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {pages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                      <Link
                        key={p}
                        href={`/products?page=${p}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${p === page ? "bg-primary text-cream" : "bg-card text-text/60 border border-text/10 hover:border-primary/40"}`}
                      >
                        {p}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  )
}
