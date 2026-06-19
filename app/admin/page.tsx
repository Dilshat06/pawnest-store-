"use client"

import { useState } from "react"
import Image from "next/image"

interface CJProduct {
  cjProductId: string
  title:       string
  image:       string
  price:       number | null
  category:    string
}

export default function AdminPage() {
  const [keyword, setKeyword]     = useState("")
  const [category, setCategory]   = useState("Dog Essentials")
  const [markup, setMarkup]       = useState(2)
  const [products, setProducts]   = useState<CJProduct[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [importing, setImporting] = useState<string | null>(null)
  const [imported, setImported]   = useState<Set<string>>(new Set())

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    setLoading(true)
    setError("")

    try {
      const res  = await fetch(`/api/admin/cj-search?keyword=${encodeURIComponent(keyword)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Ошибка поиска")
      setProducts(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка поиска")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (cjProductId: string) => {
    setImporting(cjProductId)
    setError("")

    try {
      const res  = await fetch("/api/admin/cj-import", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cjProductId, category, markup }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Ошибка импорта")
      setImported((prev) => new Set(prev).add(cjProductId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка импорта")
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-14">
        <h1 className="font-playfair text-3xl font-bold text-text mb-2">CJ Import — Admin</h1>
        <p className="text-text/50 text-sm mb-10">Найди товары в CJ Dropshipping и импортируй их в каталог PawNest.</p>

        {/* Параметры импорта */}
        <div className="bg-card rounded-2xl border border-text/10 p-6 mb-8 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Например: dog bed, pet leash, cat toy..."
              className="flex-1 border border-text/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-cream px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Ищем..." : "Найти в CJ"}
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-text/60 block mb-1">Категория для импорта</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-text/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-text/60 block mb-1">Наценка (× к закупке)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={markup}
                onChange={(e) => setMarkup(Number(e.target.value))}
                className="w-28 border border-text/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Результаты поиска */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => {
              const isImported  = imported.has(p.cjProductId)
              const isImporting = importing === p.cjProductId
              return (
                <div key={p.cjProductId} className="bg-card rounded-2xl border border-text/10 shadow-sm overflow-hidden">
                  <div className="relative aspect-square bg-cream">
                    {p.image ? (
                      <Image src={p.image} alt={p.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl text-text/20">🐾</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-text text-sm line-clamp-2 mb-2">{p.title}</h3>
                    <p className="text-primary font-bold mb-3">
                      {p.price != null ? `$${p.price.toFixed(2)}` : "Цена по запросу"} <span className="text-text/40 text-xs">закупка</span>
                    </p>
                    <button
                      onClick={() => handleImport(p.cjProductId)}
                      disabled={isImporting || isImported}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isImported
                          ? "bg-green-100 text-green-700"
                          : "bg-primary text-cream hover:bg-primary/90 disabled:opacity-50"
                      }`}
                    >
                      {isImported ? "✓ Импортирован" : isImporting ? "Импортируем..." : "Импортировать"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-16 text-text/40">
            <p className="text-4xl mb-3">🔍</p>
            <p>Введите ключевые слова для поиска товаров в CJ</p>
          </div>
        )}
      </div>
    </div>
  )
}
