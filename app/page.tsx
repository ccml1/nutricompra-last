import { LandingCta, LandingFooter } from '@/components/landing/landing-cta'
import { LandingFeatures } from '@/components/landing/landing-features'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingSteps } from '@/components/landing/landing-steps'

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingSteps />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
