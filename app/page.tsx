import Navbar           from "@/components/landing/Navbar"
import HeroSection      from "@/components/landing/HeroSection"
import CollectionSection from "@/components/landing/CollectionSection"
import PhilosophySection from "@/components/landing/PhilosophySection"
import BenefitsSection   from "@/components/landing/BenefitsSection"
import StatsSection      from "@/components/landing/StatsSection"
import FooterSection     from "@/components/landing/FooterSection"

export default function HomePage() {
  return (
    <main className="bg-charcoal">
      <Navbar />
      <HeroSection />
      <CollectionSection />
      <PhilosophySection />
      <BenefitsSection />
      <StatsSection />
      <FooterSection />
    </main>
  )
}
