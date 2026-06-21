"use client"

import { useEffect, useState } from "react"

interface AdminOrder {
  id: string
  status: string
  customerName: string
  customerEmail: string
  totalPrice: number
  cjOrderId: string | null
  trackingNumber: string | null
  createdAt: string
  items: { quantity: number; product: { title: string } }[]
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-text/10 text-text/60",
  PAID:       "bg-amber/20 text-amber",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED:    "bg-purple-100 text-purple-700",
  DELIVERED:  "bg-green-100 text-green-700",
  CANCELLED:  "bg-red-100 text-red-600",
}

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<AdminOrder[]>([])
  const [loading, setLoading]   = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [error, setError]       = useState("")

  const load = () => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const retryCJ = async (id: string) => {
    setRetrying(id)
    setError("")
    try {
      const res  = await fetch(`/api/admin/orders/${id}/retry-cj`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Retry failed")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed")
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-playfair text-3xl font-bold text-text mb-2">Orders</h1>
        <p className="text-text/50 text-sm mb-8">{orders.length} orders</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-text/40 text-center py-16">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const stuck = order.status === "PAID" && !order.cjOrderId
              return (
                <div key={order.id} className="bg-card rounded-2xl border border-text/10 shadow-sm p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-text text-sm">
                      {order.customerName} <span className="text-text/40 font-normal">· {order.customerEmail}</span>
                    </p>
                    <p className="text-text/40 text-xs mt-0.5">
                      #{order.id.slice(-8)} · {new Date(order.createdAt).toLocaleString()} · {order.items.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${STATUS_COLORS[order.status] ?? "bg-text/10 text-text/60"}`}>
                    {order.status}
                  </span>

                  {order.trackingNumber && (
                    <span className="text-xs text-text/50 shrink-0">📦 {order.trackingNumber}</span>
                  )}

                  <span className="font-bold text-text shrink-0">${order.totalPrice.toFixed(2)}</span>

                  {stuck && (
                    <button
                      onClick={() => retryCJ(order.id)}
                      disabled={retrying === order.id}
                      className="bg-primary text-cream text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 shrink-0"
                    >
                      {retrying === order.id ? "Retrying…" : "Retry CJ"}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
