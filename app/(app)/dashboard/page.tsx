'use client'

import Link from 'next/link'
import { ArrowRight, Check, ChevronRight, Lightbulb, PiggyBank, Utensils, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { mealTypeLabels, weekdayLabels } from '@/data/mock-plan'
import { usePlan } from '@/hooks/use-plan'
import { formatCurrency } from '@/lib/format'
import { familyCost } from '@/lib/portions'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/use-auth'
import { useGuide } from '@/store/use-guide'

/** El recorrido de la primera vez, en el orden en que tiene sentido usar NutriCompra. */
const firstSteps = [
  { href: '/meal-plan', title: 'Revisa tu menú de la semana', hint: 'Cambia los platos que no te gusten.' },
  { href: '/shopping-list', title: 'Mira tu lista de compras', hint: 'Sale de tu menú, ordenada por categorías.' },
  { href: '/prices', title: 'Compara precios', hint: 'Encuentra dónde te sale más barato cada producto.' },
  { href: '/weight', title: 'Calcula cuánto necesitas comer', hint: 'Con tu peso, estatura y actividad.' },
]

const today = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

function FirstSteps() {
  const visited = useGuide((s) => s.visited)
  const dismissed = useGuide((s) => s.dismissed)
  const dismiss = useGuide((s) => s.dismiss)
  const done = firstSteps.filter((step) => visited.includes(step.href)).length
  if (dismissed || done === firstSteps.length) return null
  const next = firstSteps.find((step) => !visited.includes(step.href))

  return (
    <section aria-labelledby="first-steps-title" className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/60 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="first-steps-title" className="font-heading text-xl font-bold tracking-tight">Empieza por aquí</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {done === 0 ? 'Cuatro pasos para sacarle provecho a tu semana.' : `Llevas ${done} de ${firstSteps.length}. ¡Vas bien!`}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ocultar la guía"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <Progress value={(done / firstSteps.length) * 100} aria-label={`${done} de ${firstSteps.length} pasos`} className="mt-4 h-1.5" />
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {firstSteps.map((step, index) => {
          const complete = visited.includes(step.href)
          const isNext = step === next
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isNext ? 'border-primary/40 bg-secondary/60 hover:bg-secondary' : 'border-border hover:bg-muted/60',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold tabular-nums',
                    complete ? 'bg-primary text-primary-foreground' : isNext ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {complete ? <Check className="size-4" aria-label="Hecho" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm font-semibold', complete && 'text-muted-foreground line-through decoration-muted-foreground/50')}>
                    {step.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">{step.hint}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default function DashboardPage() {
  const { plan, budget, recommendations, portions, people } = usePlan()
  const firstName = useAuth((s) => s.user?.firstName)
  const over = budget.remaining < 0
  const upcoming = plan.days
    .slice(0, 3)
    .flatMap((day) => [
      { day: weekdayLabels[day.day], type: mealTypeLabels.desayuno, meal: day.desayuno },
      { day: weekdayLabels[day.day], type: mealTypeLabels.almuerzo, meal: day.almuerzo },
    ])
    .slice(0, 4)

  return (
    <main>
      <header className="border-b bg-background/90 px-5 py-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground first-letter:uppercase">{today}</p>
            <h1 className="mt-0.5 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hola{firstName ? `, ${firstName}` : ''}
            </h1>
          </div>
          <Badge variant="secondary" className="hidden px-3 py-1.5 sm:flex">
            {plan.weekLabel}
          </Badge>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-7 lg:px-10 lg:py-9">
        <FirstSteps />

        <section aria-labelledby="budget-title" className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
            <h2 id="budget-title" className="text-sm font-medium text-primary-foreground/85">
              Gasto de la semana para {people} {people === 1 ? 'persona' : 'personas'}
            </h2>
            <p className="mt-2 font-heading text-4xl font-bold tabular-nums sm:text-5xl">
              {formatCurrency(budget.estimatedTotal)}
              <span className="ml-2 text-lg font-medium text-primary-foreground/80">de {formatCurrency(budget.budget)}</span>
            </p>
            <Progress
              value={Math.min(budget.usedPercent, 100)}
              aria-label={`${Math.round(budget.usedPercent)} % del presupuesto`}
              className="mt-5 [&_[data-slot=progress-indicator]]:bg-primary-foreground [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-primary-foreground/25"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-primary-foreground/90">
                {over ? `Te pasas por ${formatCurrency(-budget.remaining)}` : `Te quedan ${formatCurrency(budget.remaining)}`}
              </span>
              <Link href="/household" className="font-semibold underline-offset-4 hover:underline">
                Cambiar presupuesto
              </Link>
            </div>
          </div>
          <Link
            href="/prices"
            className="group flex flex-col justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60 transition-colors hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PiggyBank className="size-5 text-amber-600" aria-hidden />
              Puedes ahorrar
            </span>
            <span className="font-heading text-4xl font-bold tabular-nums text-amber-700">{formatCurrency(budget.savings)}</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Comparar precios
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Tu menú de la semana</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Costo de cada comida para {people} {people === 1 ? 'persona' : 'personas'}</p>
              </div>
              <Link href="/meal-plan" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Editar menú <ChevronRight data-icon="inline-end" />
              </Link>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="grid min-w-[680px] grid-cols-7 gap-2">
                {plan.days.map((day) => (
                  <div key={day.day} className="rounded-xl border bg-muted/30 p-2.5">
                    <p className="mb-3 text-center text-xs font-bold capitalize text-foreground">{weekdayLabels[day.day].slice(0, 3)}</p>
                    <div className="flex flex-col gap-2">
                      {[day.desayuno, day.almuerzo, day.cena].map((meal) => (
                        <div key={meal.id} className="rounded-lg bg-background p-2 shadow-sm">
                          <p className="truncate text-[10px] font-medium text-muted-foreground">{mealTypeLabels[meal.type]}</p>
                          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug">{meal.name}</p>
                          <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">S/ {familyCost(meal.estimatedCost, portions).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximas comidas</CardTitle>
              <p className="text-sm text-muted-foreground">Lo que sigue en tu menú</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {upcoming.map(({ day, type, meal }) => (
                <div key={`${day}-${type}`} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Utensils className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {day} · {type}
                    </p>
                    <p className="truncate text-sm font-semibold">{meal.name}</p>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">S/ {familyCost(meal.estimatedCost, portions).toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <section aria-labelledby="recommendations-title">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-500" aria-hidden />
            <h2 id="recommendations-title" className="font-heading text-xl font-bold tracking-tight">
              Ideas para tu semana
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.slice(0, 3).map((recommendation) => (
              <Card key={recommendation.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base leading-snug">{recommendation.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="text-sm leading-relaxed text-muted-foreground">{recommendation.message}</p>
                  {recommendation.actionHref && (
                    <Link href={recommendation.actionHref} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      {recommendation.actionLabel} <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
