import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default function OnboardingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Configuración inicial</p>
          <h1 className="text-balance font-display text-3xl font-bold tracking-tight text-foreground">
            Cuéntanos sobre tu hogar
          </h1>
          <p className="mt-2 text-muted-foreground">
            Con estos datos crearemos un menú semanal y una lista de compras a tu
            medida.
          </p>
        </div>
        <OnboardingForm />
      </main>
    </div>
  )
}
