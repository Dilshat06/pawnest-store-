"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

const navLinks = [
  { label: "Collection", href: "/products" },
  { label: "Essentials",  href: "#essentials" },
  { label: "Community",   href: "#community"  },
  { label: "About",       href: "#about"      },
  { label: "Shop",        href: "/products"   },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [lang, setLang]         = useState<"EN" | "RU">("EN")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0,   opacity: 1  }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-darkbrown/80 backdrop-blur-xl border-b border-white/10 shadow-xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-playfair text-2xl font-bold tracking-[0.15em] text-cream hover:text-amber transition-colors">
          PawNest
        </Link>

        {/* Links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-cream/70 hover:text-cream text-sm tracking-widest uppercase transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-amber group-hover:w-full transition-all duration-300" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Lang switcher */}
        <div className="flex items-center gap-1 text-xs tracking-widest">
          {(["EN", "RU"] as const).map((l, i) => (
            <span key={l} className="flex items-center gap-1">
              {i > 0 && <span className="text-cream/30">/</span>}
              <button
                onClick={() => setLang(l)}
                className={`transition-colors ${lang === l ? "text-amber font-semibold" : "text-cream/50 hover:text-cream"}`}
              >
                {l}
              </button>
            </span>
          ))}
        </div>
      </div>
    </motion.nav>
  )
}
