"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function ShopHeader() {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      fetch("/api/cart")
        .then((r) => r.json())
        .then((data) => {
          const items: { quantity: number }[] = data.items ?? []
          setCartCount(items.reduce((sum, item) => sum + item.quantity, 0))
        })
        .catch(() => {})
    }
    updateCount()
    window.addEventListener("cart-updated", updateCount)
    return () => window.removeEventListener("cart-updated", updateCount)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-text/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-playfair text-xl font-bold tracking-[0.15em] text-text hover:text-primary transition-colors">
            PawNest
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-text/70 hover:text-primary text-sm tracking-widest uppercase transition-colors">
              Home
            </Link>
            <Link href="/products" className="text-text/70 hover:text-primary text-sm tracking-widest uppercase transition-colors">
              Shop
            </Link>
          </nav>

          <Link href="/cart" className="relative flex items-center gap-2 text-text/70 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline text-sm font-medium tracking-widest uppercase">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-cream text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
