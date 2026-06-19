"use client"

import { motion } from "framer-motion"
import Link from "next/link"

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 40 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.9, delay, ease: "easeOut" as const },
})

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-darkbrown">
      {/* Video background */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-darkbrown/85 via-darkbrown/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-darkbrown/90 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 lg:px-10 flex flex-col justify-between py-24">
        <div />

        <div className="flex flex-col justify-end h-full pb-8">
          {/* Large headline — left */}
          <motion.h1
            {...fadeUp(0.2)}
            className="font-playfair font-bold uppercase leading-none text-cream mb-auto mt-24"
            style={{ fontSize: "clamp(5rem, 12vw, 13rem)", lineHeight: 0.9 }}
          >
            HAPPY<br />
            <span className="text-amber italic">TAILS</span><br />
            START HERE
          </motion.h1>

          {/* Bottom row: CTAs left, caption right */}
          <div className="flex items-end justify-between mt-12 gap-8 flex-wrap">
            <motion.div {...fadeUp(0.6)} className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="group relative inline-flex items-center gap-2 bg-primary text-cream font-semibold px-8 py-3.5 text-sm tracking-widest uppercase overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,112,67,0.5)]"
              >
                <span className="relative z-10">Shop Collection</span>
                <span className="relative z-10 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="#essentials"
                className="inline-flex items-center gap-2 border border-cream/40 text-cream font-medium px-8 py-3.5 text-sm tracking-widest uppercase hover:border-amber hover:text-amber transition-all duration-300"
              >
                Our Story
              </Link>
            </motion.div>

            <motion.p
              {...fadeUp(0.8)}
              className="text-cream/60 text-sm max-w-xs text-right leading-relaxed"
            >
              Thoughtfully crafted essentials<br />
              for happier, healthier pets.<br />
              Comfort and joy, in every detail.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-cream/40 text-xs tracking-[0.3em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-px h-8 bg-gradient-to-b from-amber to-transparent"
        />
      </motion.div>
    </section>
  )
}
