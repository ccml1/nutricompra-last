import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

export function LandingCta() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-sidebar px-6 py-14 text-center">
          <h2 className="max-w-2xl text-balance font-display text-3xl font-bold tracking-tight text-sidebar-foreground sm:text-4xl">
            Empieza a planificar la alimentación de tu hogar hoy
          </h2>
          <p className="max-w-lg text-pretty text-sidebar-foreground/70">
            Crea tu cuenta gratis y obtén tu primer menú semanal con lista de
            compras en minutos.
          </p>
          <Button asChild size="lg">
            <Link href="/register">
              Empezar gratis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo />
        <p className="text-sm text-muted-foreground">
          Proyecto demostrativo. Datos y precios ficticios con fines ilustrativos.
        </p>
      </div>
    </footer>
  )
}
