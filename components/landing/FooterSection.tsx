"use client"

import Link from "next/link"

const navGroups = [
  {
    title: "Shop",
    links: [
      { label: "Collection",   href: "/products" },
      { label: "New Arrivals", href: "/products" },
      { label: "Best Sellers", href: "/products" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Essentials",  href: "#essentials" },
      { label: "Community",   href: "#community"  },
      { label: "Pet Care Guide", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About",         href: "#about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
]

const socials = [
  { label: "IG",  href: "#" },
  { label: "TW",  href: "#" },
  { label: "YT",  href: "#" },
  { label: "PIN", href: "#" },
]

export default function FooterSection() {
  return (
    <footer className="bg-darkbrown border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="font-playfair text-3xl font-bold tracking-[0.15em] text-cream hover:text-amber transition-colors block">
              PawNest
            </Link>
            <p className="text-cream/50 text-sm leading-relaxed max-w-xs">
              Comfort made for paws. Thoughtfully crafted<br />
              essentials for your pet&apos;s happiest moments.
            </p>
            <div className="flex items-center gap-4 pt-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="text-xs text-cream/40 hover:text-amber tracking-widest transition-colors border border-white/10 hover:border-amber/40 w-9 h-9 flex items-center justify-center rounded-full"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {navGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <p className="text-cream/30 text-xs tracking-[0.3em] uppercase">{group.title}</p>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-cream/60 hover:text-cream text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream/30 text-xs tracking-wide">
            © {new Date().getFullYear()} PawNest. All rights reserved.
          </p>
          <p className="text-cream/20 text-xs italic font-playfair">
            &quot;Every paw deserves a soft place to land.&quot;
          </p>
          <div className="flex gap-6 text-cream/30 text-xs">
            <Link href="/privacy" className="hover:text-cream transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-cream transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
