"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import ShopHeader from "@/components/ShopHeader"
import FooterSection from "@/components/landing/FooterSection"

type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { title: string; images: string[] }
  variant: { name: string } | null
}

interface Order {
  id: string
  status: OrderStatus
  totalPrice: number
  trackingNumber: string | null
  customerName: string
  createdAt: string
  items: OrderItem[]
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:    "Awaiting payment",
  PAID:       "Payment confirmed",
  PROCESSING: "Preparing your order",
  SHIPPED:    "Shipped",
  DELIVERED:  "Delivered",
  CANCELLED:  "Cancelled",
}

const STATUS_STEPS: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]

export default function OrderStatusPage() {
  const { id }    = useParams<{ id: string }>()
  const token     = useSearchParams().get("token")
  const [order, setOrder]     = useState<Order | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError]     = useState(token ? "" : "Missing access token. Please use the link from your confirmation email.")

  useEffect(() => {
    if (!token) return

    fetch(`/api/orders/${id}?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Order not found")
        return r.json()
      })
      .then((data) => setOrder(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Order not found"))
      .finally(() => setLoading(false))
  }, [id, token])

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1

  return (
    <div className="bg-cream min-h-screen">
      <ShopHeader />
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🐾</p>
            <p className="text-text/60 mb-4 font-playfair text-lg">{error}</p>
            <Link href="/products" className="text-primary font-medium">← Back to Shop</Link>
          </div>
        )}

        {!loading && order && (
          <>
            <h1 className="font-playfair text-3xl font-bold text-text mb-1">Order Status</h1>
            <p className="text-text/40 text-sm mb-10">Order #{order.id.slice(-8)} · placed {new Date(order.createdAt).toLocaleDateString()}</p>

            {order.status === "CANCELLED" ? (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-10 text-sm">
                This order was cancelled.
              </div>
            ) : (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-2">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} className="flex-1 flex flex-col items-center text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${i <= stepIndex ? "bg-primary text-cream" : "bg-text/10 text-text/40"}`}>
                        {i < stepIndex ? "✓" : i + 1}
                      </div>
                      <p className={`text-xs ${i <= stepIndex ? "text-text font-medium" : "text-text/40"}`}>{STATUS_LABELS[step]}</p>
                    </div>
                  ))}
                </div>
                <div className="h-1 bg-text/10 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${stepIndex < 0 ? 0 : (stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {order.trackingNumber && (
              <div className="bg-card border border-text/10 rounded-xl px-4 py-3 mb-6 text-sm">
                <span className="text-text/50">Tracking number: </span>
                <span className="font-medium text-text">{order.trackingNumber}</span>
              </div>
            )}

            <div className="bg-card rounded-2xl border border-text/10 shadow-sm p-5 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-medium text-text">{item.product.title}</p>
                    {item.variant && <p className="text-text/40">{item.variant.name}</p>}
                    <p className="text-text/40">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-text">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t border-text/10 pt-3 flex justify-between font-bold text-text">
                <span>Total</span>
                <span>${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Link href="/products" className="inline-block mt-10 text-primary font-medium">← Continue Shopping</Link>
          </>
        )}
      </div>
      <FooterSection />
    </div>
  )
}
