"use client"

import { motion } from "framer-motion"

const benefits = [
  {
    emoji:   "😴",
    tag:     "Sleep & Recovery",
    title:   "Orthopedic Support, Real Science",
    desc:    "Our memory foam beds distribute weight evenly, easing pressure on joints and hips. Vets recommend orthopedic support for senior pets and active breeds alike — better sleep means better days.",
    reverse: false,
  },
  {
    emoji:   "🦴",
    tag:     "Health & Hygiene",
    title:   "Healthy Habits, Made Simple",
    desc:    "From dental-friendly chew toys to de-shedding brushes, every product supports your pet's daily wellness routine — reducing shedding, plaque, and stress in just minutes a day.",
    reverse: true,
  },
]

export default function BenefitsSection() {
  return (
    <section id="community" className="bg-darkbrown py-28 px-6 lg:px-10 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-24">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className={`flex flex-col ${b.reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-16`}
          >
            <div className="flex-1 relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/50 to-darkbrown border border-white/10 flex items-center justify-center">
                <span className="text-[8rem]">{b.emoji}</span>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full border border-amber/20 bg-amber/5 backdrop-blur-sm hidden md:block" />
            </div>

            <div className="flex-1 space-y-5">
              <p className="text-amber text-xs tracking-[0.4em] uppercase">{b.tag}</p>
              <h3 className="font-playfair text-4xl md:text-5xl text-cream font-bold leading-tight">{b.title}</h3>
              <div className="w-12 h-px bg-amber" />
              <p className="text-cream/60 text-base leading-relaxed">{b.desc}</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 text-sm text-amber border-b border-amber/40 hover:border-amber pb-0.5 transition-colors tracking-widest uppercase"
              >
                Learn more →
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
