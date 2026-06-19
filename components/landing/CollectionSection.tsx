"use client"

import { motion } from "framer-motion"
import Link from "next/link"

const products = [
  {
    name:   "Cloud Nap Bed",
    origin: "Orthopedic Memory Foam",
    desc:   "Pressure-relief foam that cradles joints and supports deep, restful sleep for pets of every age.",
    price:  "$59",
    badge:  "Bestseller",
  },
  {
    name:   "Wanderer Leash",
    origin: "Full-Grain Leather",
    desc:   "Hand-stitched leather leash built for daily adventures — strong, soft-gripped, beautifully aged over time.",
    price:  "$38",
    badge:  "Durable",
  },
  {
    name:   "Forest Chew Toy",
    origin: "Natural Rubber",
    desc:   "Non-toxic, vet-approved chew toy that satisfies instincts while keeping teeth clean and gums healthy.",
    price:  "$22",
    badge:  "Vet-Approved",
  },
  {
    name:   "Groom & Glow Brush",
    origin: "Self-Cleaning Bristles",
    desc:   "Gentle de-shedding brush that reduces loose fur by up to 90% while keeping the coat glossy and smooth.",
    price:  "$29",
    badge:  "Top Rated",
  },
]

export default function CollectionSection() {
  return (
    <section id="collection" className="bg-darkbrown py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <p className="text-amber text-xs tracking-[0.4em] uppercase mb-3">Featured Collection</p>
          <h2 className="font-playfair text-5xl md:text-6xl text-cream font-bold leading-tight">
            Essentials for<br />
            <span className="italic text-amber">Happier Pets</span>
          </h2>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product, i) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="group relative rounded-2xl overflow-hidden border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 hover:border-amber/30 transition-all duration-500 p-6 flex flex-col"
              style={{ backdropFilter: "blur(16px)" }}
            >
              <span className="inline-block text-xs tracking-widest uppercase text-amber border border-amber/40 px-3 py-1 rounded-full mb-5 w-fit">
                {product.badge}
              </span>

              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-amber/20 mb-6 flex items-center justify-center text-3xl">
                🐾
              </div>

              <p className="text-cream/50 text-xs tracking-widest uppercase mb-1">{product.origin}</p>
              <h3 className="font-playfair text-2xl text-cream font-semibold mb-3">{product.name}</h3>
              <p className="text-cream/60 text-sm leading-relaxed flex-1 mb-6">{product.desc}</p>

              <div className="flex items-center justify-between">
                <span className="text-amber font-semibold text-lg">{product.price}</span>
                <Link
                  href="/products"
                  className="text-xs tracking-widest uppercase text-cream/60 hover:text-amber border-b border-transparent hover:border-amber transition-all duration-200 pb-0.5"
                >
                  Discover →
                </Link>
              </div>

              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at top, rgba(255,167,38,0.08) 0%, transparent 70%)" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
