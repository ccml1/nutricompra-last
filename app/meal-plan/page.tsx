'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Menu,
  Utensils,
} from 'lucide-react'
import { AppSidebar } from '@/components/app/app-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { mealTypeLabels, weekdayLabels } from '@/data/mock-plan'
import { budgetLevelLabels } from '@/lib/budget'
import { usePlan } from '@/hooks/use-plan'
import type { Meal } from '@/types'

const mealTypes = ['desayuno', 'almuerzo', 'cena'] as const

const healthStyles = {
  alto: 'border-primary/20 bg-primary/10 text-primary',
  medio: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  bajo: 'border-destructive/20 bg-destructive/10 text-destructive',
} as const

function MealCard({ meal }: { meal: Meal }) {
  return (
    <article className="flex min-h-44 flex-col rounded-xl border bg-background p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Utensils className="size-4" aria-hidden />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {mealTypeLabels[meal.type]}
          </p>
        </div>
        <Badge variant="outline" className={healthStyles[meal.healthScore]}>
          Nutrición {meal.healthScore}
        </Badge>
      </div>
      <h3 className="mt-4 line-clamp-2 text-sm font-bold leading-snug">{meal.name}</h3>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Costo estimado</p>
          <p className="mt-0.5 font-heading text-lg font-bold">S/ {meal.estimatedCost.toFixed(2)}</p>
        </div>
        <Link
          href={`/meal-plan/${meal.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          aria-label={`Ver detalle de ${meal.name}`}
        >
          Ver detalle <ArrowRight data-icon="inline-end" />
        </Link>
      </div>
    </article>
  )
}

export default function MealPlanPage() {
  const { plan, budget } = usePlan()
  const progress = Math.min(budget.usedPercent, 100)

  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />
      <main className="lg:pl-64">
        <header className="border-b bg-background/90 px-5 py-5 backdrop-blur lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú">
                <Menu data-icon="inline-start" />
              </Button>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organiza tus comidas</p>
                <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Plan semanal</h1>
              </div>
            </div>
            <Badge variant="secondary" className="hidden gap-1.5 px-3 py-1.5 sm:flex">
              <CalendarDays data-icon="inline-start" /> {plan.weekLabel}
            </Badge>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-7 lg:px-10 lg:py-9">
          <section aria-labelledby="plan-summary-title" className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card className="border-primary/20 bg-primary text-primary-foreground">
              <CardHeader className="flex-row items-start justify-between pb-3">
                <div>
                  <CardTitle id="plan-summary-title" className="text-base text-primary-foreground/85">Costo estimado del plan</CardTitle>
                  <p className="mt-1 text-sm text-primary-foreground/70">Las 21 comidas de esta semana</p>
                </div>
                <CircleDollarSign className="size-6 text-primary-foreground/70" aria-hidden />
              </CardHeader>
              <CardContent className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="font-heading text-4xl font-bold">S/ {budget.estimatedTotal.toFixed(2)}</p>
                  <p className="mt-1 text-sm text-primary-foreground/70">de S/ {budget.budget.toFixed(2)} disponibles</p>
                </div>
                <div className="min-w-44 flex-1 sm:max-w-xs">
                  <div className="mb-2 flex justify-between text-xs font-medium text-primary-foreground/80">
                    <span>{Math.round(budget.usedPercent)}% utilizado</span>
                    <span>{budgetLevelLabels[budget.level]}</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-primary-foreground/20 [&>div]:bg-primary-foreground" aria-label={`${Math.round(budget.usedPercent)}% del presupuesto utilizado`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Tu presupuesto</CardTitle></CardHeader>
              <CardContent className="flex items-end justify-between gap-4">
                <div><p className="text-sm text-muted-foreground">Disponible después del plan</p><p className="mt-1 font-heading text-3xl font-bold">S/ {budget.remaining.toFixed(2)}</p></div>
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver resumen <ChevronRight data-icon="inline-end" /></Link>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="weekly-plan-title">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><p className="text-sm font-medium text-primary">21 comidas organizadas</p><h2 id="weekly-plan-title" className="font-heading text-xl font-bold tracking-tight">Tu semana de comidas</h2></div>
              <span className="hidden text-sm text-muted-foreground sm:block">Selecciona una comida para ver más</span>
            </div>
            <div className="flex flex-col gap-4">
              {plan.days.map((day) => (
                <Card key={day.day}>
                  <CardHeader className="border-b bg-muted/20 px-5 py-4"><CardTitle className="text-lg">{weekdayLabels[day.day]}</CardTitle></CardHeader>
                  <CardContent className="grid gap-3 p-4 md:grid-cols-3">
                    {mealTypes.map((type) => <MealCard key={`${day.day}-${type}`} meal={day[type]} />)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
