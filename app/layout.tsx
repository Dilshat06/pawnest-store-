import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets:  ["latin"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title:       "PawNest — Comfort Made for Paws",
  description: "Thoughtfully crafted essentials for happier, healthier pets. Comfort, care, and joy in every product.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-cream text-text font-inter antialiased">
        {children}
      </body>
    </html>
  )
}
