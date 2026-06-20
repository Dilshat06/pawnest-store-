import ShopHeader from "@/components/ShopHeader"
import FooterSection from "@/components/landing/FooterSection"

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-cream min-h-screen">
      <ShopHeader />
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
        <h1 className="font-playfair text-4xl font-bold text-text mb-2">{title}</h1>
        <p className="text-text/40 text-sm mb-10">Last updated: {updated}</p>
        <div className="prose-legal space-y-6 text-text/70 text-sm leading-relaxed [&_h2]:font-playfair [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </div>
      <FooterSection />
    </div>
  )
}
