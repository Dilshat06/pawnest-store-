import Link from "next/link"
import ShopHeader from "@/components/ShopHeader"

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; token?: string }>
}) {
  const { orderId, token } = await searchParams

  return (
    <div className="bg-cream min-h-screen">
      <ShopHeader />
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <div className="text-7xl mb-6">🐾</div>
        <h1 className="font-playfair text-3xl font-bold text-text mb-3">Order Confirmed!</h1>
        <p className="text-text/60 mb-2">Your pet&apos;s new essentials are on the way.</p>
        <p className="text-text/60 mb-8">A confirmation with tracking details will arrive in your inbox shortly.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && token && (
            <Link
              href={`/orders/${orderId}?token=${token}`}
              className="inline-block border-2 border-primary text-primary font-bold px-8 py-3 rounded-xl hover:bg-primary/10 transition-colors tracking-wide uppercase text-sm"
            >
              Track Order
            </Link>
          )}
          <Link
            href="/products"
            className="inline-block bg-primary text-cream font-bold px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors tracking-wide uppercase text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
