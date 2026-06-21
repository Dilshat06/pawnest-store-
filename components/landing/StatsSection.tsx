"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref      = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const duration  = 2000
    const steps     = 60
    const increment = target / steps
    let current     = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isInView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

const stats = [
  { value: 18,    suffix: "",   label: "Countries Shipped",  sub: "Loved by pet parents worldwide" },
  { value: 100,   suffix: "%",  label: "Vet-Reviewed",       sub: "Every product, checked and approved" },
  { value: 2019,  suffix: "",   label: "Year Founded",       sub: "Built by pet lovers, for pet lovers" },
  { value: 50,    suffix: "k+", label: "Happy Pets",         sub: "And counting every single day" },
]

const testimonials = [
  {
    quote: "The Cloud Nap Bed changed my senior dog's life. She finally sleeps through the night without stiffness.",
    name:  "Amara Osei",
    role:  "Dog mom, Accra",
  },
  {
    quote: "Finally a chew toy that survives my pup's jaws. Vet-approved and actually keeps his teeth clean.",
    name:  "Léa Fontaine",
    role:  "Cat & dog owner, Paris",
  },
  {
    quote: "The Groom & Glow brush cut our shedding season in half. Our home — and couch — thank PawNest.",
    name:  "Kenji Mori",
    role:  "Shiba Inu owner, Kyoto",
  },
]

export default function StatsSection() {
  return (
    <section id="about" className="bg-cream py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-28 border-b border-text/10 pb-20">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-playfair text-5xl md:text-6xl font-bold text-primary mb-2">
                <Counter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-text font-semibold text-sm tracking-wide mb-1">{s.label}</p>
              <p className="text-text/50 text-xs">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">Testimonials</p>
          <h2 className="font-playfair text-4xl md:text-5xl text-text font-bold">
            Loved by <span className="italic">Pet Parents</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="bg-text/5 rounded-2xl p-8 border border-text/10 relative"
            >
              <span className="font-playfair text-6xl text-amber/40 absolute top-4 left-6 leading-none select-none">&quot;</span>
              <p className="text-text/70 text-sm leading-relaxed mt-6 mb-6 relative z-10 italic">
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber/60 flex items-center justify-center text-cream text-sm font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-text font-semibold text-sm">{t.name}</p>
                  <p className="text-text/50 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
