import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, PiggyBank, Salad, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'

const stats = [
  { icon: PiggyBank, value: 'S/ 180', label: 'presupuesto semanal' },
  { icon: Salad, value: '21', label: 'comidas planificadas' },
  { icon: Store, value: '4', label: 'establecimientos comparados' },
]

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Alimentación inteligente para tu hogar
          </span>
          <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Come bien, gasta mejor y{' '}
            <span className="text-primary">ahorra cada semana</span>
          </h1>
          <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            NutriCompra planifica menús nutritivos según tu presupuesto, arma tu
            lista de compras y compara precios entre mercados y supermercados.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">
                Crear mi plan
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
          <dl className="mt-4 grid w-full max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <Icon className="size-4 text-primary" aria-hidden />
                <dt className="font-display text-xl font-bold text-foreground">{value}</dt>
                <dd className="text-xs leading-tight text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-secondary/60" aria-hidden />
          <div className="overflow-hidden rounded-2xl border border-border shadow-xl">
            <Image
              src="/images/hero-groceries.png"
              alt="Alimentos frescos y económicos sobre una mesa de madera"
              width={720}
              height={720}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
