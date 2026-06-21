import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="bg-darkbrown text-cream/80 px-6 py-3 flex gap-6 text-sm font-medium">
        <Link href="/admin" className="hover:text-cream transition-colors">Import Products</Link>
        <Link href="/admin/orders" className="hover:text-cream transition-colors">Orders</Link>
      </div>
      {children}
    </div>
  )
}
