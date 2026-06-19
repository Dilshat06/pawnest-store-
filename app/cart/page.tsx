"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import ShopHeader from "@/components/ShopHeader"

interface CartItem {
  key:       string
  productId: string
  variantId: string | null
  title:     string
  price:     number
  image:     string
  quantity:  number
}

interface CheckoutForm {
  customerEmail: string
  customerName:  string
  phone:         string
  country:       string
  city:          string
  address:       string
  zipCode:       string
}

export default function CartPage() {
  const [cart, setCart]         = useState<CartItem[]>([])
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState<CheckoutForm>({
    customerEmail: "", customerName: "", phone: "",
    country: "", city: "", address: "", zipCode: "",
  })

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart") ?? "[]"))
  }, [])

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
    window.dispatchEvent(new Event("cart-updated"))
  }

  const changeQty = (key: string, delta: number) => {
    const updated = cart.map((item) =>
      item.key === key ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    )
    updateCart(updated)
  }

  const removeItem = (key: string) => updateCart(cart.filter((i) => i.key !== key))

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return
    setLoading(true)

    try {
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: form.customerEmail,
          customerName:  form.customerName,
          address: {
            name:    form.customerName,
            phone:   form.phone,
            country: form.country,
            city:    form.city,
            address: form.address,
            zipCode: form.zipCode,
          },
          items: cart.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity:  item.quantity,
          })),
        }),
      })

      const data = await res.json()
      if (data.checkoutUrl) {
        localStorage.removeItem("cart")
        window.dispatchEvent(new Event("cart-updated"))
        window.location.href = data.checkoutUrl
      } else {
        alert("Checkout error: " + (data.error ?? "unknown error"))
      }
    } catch {
      alert("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) return (
    <div className="bg-cream min-h-screen">
      <ShopHeader />
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-6xl mb-4">🐾</p>
        <h1 className="font-playfair text-2xl font-bold text-text mb-2">Your cart is empty</h1>
        <p className="text-text/50 mb-8">Add some essentials for your pet from the shop.</p>
        <Link href="/products" className="inline-block bg-primary text-cream font-bold px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors tracking-wide uppercase text-sm">
          Browse Shop
        </Link>
      </div>
    </div>
  )

  return (
    <div className="bg-cream min-h-screen">
      <ShopHeader />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <h1 className="font-playfair text-3xl font-bold text-text mb-10">Your Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Товары */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.key} className="bg-card rounded-2xl border border-text/10 shadow-sm p-4 flex gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-cream shrink-0">
                  {item.image
                    ? <Image src={item.image} alt={item.title} fill className="object-cover" />
                    : <div className="flex items-center justify-center h-full text-2xl">🐾</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text text-sm line-clamp-2">{item.title}</p>
                  <p className="text-primary font-bold mt-1">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-text/15 rounded-lg overflow-hidden">
                      <button onClick={() => changeQty(item.key, -1)} className="px-2.5 py-1 text-text/50 hover:bg-text/5">−</button>
                      <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => changeQty(item.key, +1)} className="px-2.5 py-1 text-text/50 hover:bg-text/5">+</button>
                    </div>
                    <button onClick={() => removeItem(item.key)} className="text-sm text-red-400 hover:text-red-600 transition-colors">Remove</button>
                  </div>
                </div>
                <p className="font-bold text-text shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Оформление */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-text/10 shadow-sm p-6 sticky top-20">
              <h2 className="font-playfair text-lg font-bold text-text mb-5">Checkout</h2>
              <form onSubmit={handleCheckout} className="space-y-3">
                {[
                  { name: "customerName",  label: "Name",        type: "text",  placeholder: "Jane Doe"          },
                  { name: "customerEmail", label: "Email",       type: "email", placeholder: "jane@example.com"  },
                  { name: "phone",         label: "Phone",       type: "tel",   placeholder: "+1 555 000 0000"   },
                  { name: "country",       label: "Country",     type: "text",  placeholder: "United States"     },
                  { name: "city",          label: "City",        type: "text",  placeholder: "New York"          },
                  { name: "address",       label: "Address",     type: "text",  placeholder: "123 Main St"       },
                  { name: "zipCode",       label: "ZIP Code",    type: "text",  placeholder: "10001"             },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="text-xs font-medium text-text/60 block mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      required
                      value={form[field.name as keyof CheckoutForm]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      className="w-full border border-text/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}

                <div className="border-t border-text/10 pt-4 mt-4">
                  <div className="flex justify-between text-sm text-text/50 mb-1">
                    <span>Items: {cart.reduce((s, i) => s + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-text text-lg mb-4">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-cream font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide uppercase text-sm"
                  >
                    {loading ? "Creating order..." : "Pay with Stripe →"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
