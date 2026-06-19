"use client"

import { motion } from "framer-motion"

const pillars = [
  {
    icon:     "🐾",
    title:    "Comfort",
    subtitle: "Designed for Rest",
    desc:     "Every product is shaped around how pets actually sleep, play, and move — comfort isn't an afterthought, it's the starting point.",
  },
  {
    icon:     "✦",
    title:    "Quality",
    subtitle: "Built to Last",
    desc:     "Vet-reviewed materials, rigorous testing, and zero shortcuts. We design for years of use, not just first impressions.",
  },
  {
    icon:     "♥",
    title:    "Companionship",
    subtitle: "Bonded by Care",
    desc:     "We believe every pet deserves to feel safe and loved. Our products are built to deepen the bond between pets and their people.",
  },
]

export default function PhilosophySection() {
  return (
    <section id="essentials" className="bg-cream py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">Our Philosophy</p>
          <h2 className="font-playfair text-5xl md:text-6xl text-text font-bold leading-tight">
            Three Pillars of<br />
            <span className="italic text-primary">PawNest</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-full border border-primary/30 flex items-center justify-center text-3xl mb-8 bg-primary/5">
                {p.icon}
              </div>

              <p className="text-primary text-xs tracking-[0.3em] uppercase mb-2">{p.subtitle}</p>
              <h3 className="font-playfair text-3xl text-text font-bold mb-4">{p.title}</h3>

              <div className="w-12 h-px bg-amber mb-6" />

              <p className="text-text/60 text-sm leading-relaxed max-w-xs">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
