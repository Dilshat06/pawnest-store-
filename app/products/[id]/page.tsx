"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import ShopHeader from "@/components/ShopHeader"
import FooterSection from "@/components/landing/FooterSection"

interface Variant { id: string; name: string; price: number; stock: number }
interface Review  { id: string; author: string; rating: number; comment: string; createdAt: string }
interface Product {
  id: string; title: string; description: string; price: number
  images: string[]; videoUrl: string | null; category: string; stock: number
  variants: Variant[]; reviews: Review[]
}

export default function ProductPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const [product, setProduct]         = useState<Product | null>(null)
  const [loading, setLoading]         = useState(true)
  const [selectedImage, setImage]     = useState<number | "video">(0)
  const [selectedVariant, setVariant] = useState<string | null>(null)
  const [quantity, setQuantity]       = useState(1)
  const [added, setAdded]             = useState(false)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data)
        setLoading(false)
        // Если у товара есть варианты — выбираем первый по умолчанию,
        // иначе CJ не сможет принять заказ без указания SKU варианта
        if (data?.variants?.length > 0) {
          setVariant(data.variants[0].id)
        }
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="bg-cream min-h-screen">
      <ShopHeader />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    </div>
  )

  if (!product) return (
    <div className="bg-cream min-h-screen">
      <ShopHeader />
      <div className="text-center py-24">
        <p className="text-5xl mb-4">🐾</p>
        <p className="text-text/60 mb-4 font-playfair text-lg">Product not found</p>
        <Link href="/products" className="text-primary font-medium">← Back to Shop</Link>
      </div>
    </div>
  )

  const currentPrice = selectedVariant
    ? product.variants.find((v) => v.id === selectedVariant)?.price ?? product.price
    : product.price

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") ?? "[]")
    const key  = `${product.id}-${selectedVariant ?? "default"}`
    const idx  = cart.findIndex((i: { key: string }) => i.key === key)

    if (idx >= 0) {
      cart[idx].quantity += quantity
    } else {
      cart.push({ key, productId: product.id, variantId: selectedVariant, title: product.title, price: currentPrice, image: product.images[0] ?? "", quantity })
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    window.dispatchEvent(new Event("cart-updated"))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : 0

  return (
    <div className="bg-cream min-h-screen">
      <ShopHeader />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <Link href="/products" className="text-sm text-primary hover:text-primary/80 mb-8 inline-block tracking-wide">← Back to Shop</Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
          {/* Фото / видео */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-text/10 mb-4">
              {selectedImage === "video" && product.videoUrl ? (
                <video src={product.videoUrl} controls autoPlay muted loop className="w-full h-full object-cover" />
              ) : typeof selectedImage === "number" && product.images[selectedImage] ? (
                <Image src={product.images[selectedImage]} alt={product.title} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-6xl text-text/20">🐾</div>
              )}
            </div>
            {(product.images.length > 1 || product.videoUrl) && (
              <div className="flex gap-2 overflow-x-auto">
                {product.videoUrl && (
                  <button
                    onClick={() => setImage("video")}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors bg-darkbrown flex items-center justify-center text-cream text-xl ${selectedImage === "video" ? "border-primary" : "border-transparent"}`}
                  >
                    ▶
                  </button>
                )}
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImage(i)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${i === selectedImage ? "border-primary" : "border-transparent"}`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Инфо */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm text-primary font-medium mb-1 tracking-wide uppercase">{product.category}</p>
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-text">{product.title}</h1>
            </div>

            {product.reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={s <= Math.round(avgRating) ? "text-amber" : "text-text/15"}>★</span>
                  ))}
                </div>
                <span className="text-sm text-text/50">{avgRating.toFixed(1)} ({product.reviews.length} reviews)</span>
              </div>
            )}

            <p className="text-3xl font-bold text-primary">${currentPrice.toFixed(2)}</p>

            {product.variants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-text/70 mb-2">Variant:</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariant(v.id)}
                      disabled={v.stock === 0}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${selectedVariant === v.id ? "border-primary bg-primary/10 text-primary" : "border-text/15 text-text/60 hover:border-primary/40"} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-text/70">Quantity:</p>
              <div className="flex items-center border border-text/15 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-text/50 hover:bg-text/5 transition-colors">−</button>
                <span className="px-4 py-2 font-medium text-text min-w-[2rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 text-text/50 hover:bg-text/5 transition-colors">+</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={addToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-3.5 rounded-xl font-bold text-cream tracking-wide uppercase text-sm transition-colors ${added ? "bg-green-600" : "bg-primary hover:bg-primary/90"} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {added ? "✓ Added!" : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={() => { addToCart(); router.push("/cart") }}
                disabled={product.stock === 0}
                className="flex-1 py-3.5 rounded-xl font-bold border-2 border-primary text-primary hover:bg-primary/10 tracking-wide uppercase text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            <div
              className="text-sm text-text/60 leading-relaxed [&_img]:rounded-xl [&_img]:my-3 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </div>

        {/* Отзывы */}
        {product.reviews.length > 0 && (
          <section className="mt-20">
            <h2 className="font-playfair text-2xl font-bold text-text mb-6">Reviews ({product.reviews.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {product.reviews.map((review) => (
                <div key={review.id} className="bg-card rounded-2xl border border-text/10 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-text text-sm">{review.author}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className={`text-sm ${s <= review.rating ? "text-amber" : "text-text/15"}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-text/60 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <FooterSection />
    </div>
  )
}
