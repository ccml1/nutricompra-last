'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Lightbulb,
  Menu,
  PiggyBank,
  ShoppingBasket,
  Sparkles,
  TrendingDown,
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

const quickActions = [
  { href: '/menu', label: 'Ver mi menú', icon: Utensils, tone: 'bg-primary/10 text-primary' },
  { href: '/compras', label: 'Lista de compras', icon: ShoppingBasket, tone: 'bg-amber-500/10 text-amber-700' },
  { href: '/precios', label: 'Comparar precios', icon: TrendingDown, tone: 'bg-sky-500/10 text-sky-700' },
  { href: '/nutricion', label: 'Ver nutrición', icon: Sparkles, tone: 'bg-violet-500/10 text-violet-700' },
]

export default function DashboardPage() {
  const { plan, budget, recommendations } = usePlan()
  const progress = Math.min(budget.usedPercent, 100)
  const upcoming = plan.days.slice(0, 3).flatMap((day) => [
    { day: weekdayLabels[day.day], type: mealTypeLabels.desayuno, meal: day.desayuno },
    { day: weekdayLabels[day.day], type: mealTypeLabels.almuerzo, meal: day.almuerzo },
  ]).slice(0, 4)

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
                <p className="text-sm font-medium text-muted-foreground">Martes, 10 de septiembre</p>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">¡Hola, familia!</h1>
              </div>
            </div>
            <Badge variant="secondary" className="hidden gap-1.5 px-3 py-1.5 sm:flex">
              <CalendarDays data-icon="inline-start" /> {plan.weekLabel}
            </Badge>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-7 lg:px-10 lg:py-9">
          <section aria-labelledby="budget-title">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">Tu resumen semanal</p>
                <h2 id="budget-title" className="font-heading text-xl font-bold tracking-tight">Así va tu presupuesto</h2>
              </div>
              <Link href="/compras" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex">Ver detalle <ArrowRight data-icon="inline-end" /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-primary/20 bg-primary text-primary-foreground">
                <CardHeader className="flex-row items-start justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-primary-foreground/80">Presupuesto semanal</CardTitle>
                  <CircleDollarSign className="size-5 text-primary-foreground/70" aria-hidden />
                </CardHeader>
                <CardContent><p className="font-heading text-3xl font-bold">S/ {budget.budget.toFixed(2)}</p><p className="mt-1 text-xs text-primary-foreground/70">Para todo el hogar</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-start justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Gasto estimado</CardTitle><Utensils className="size-5 text-muted-foreground" aria-hidden /></CardHeader>
                <CardContent><p className="font-heading text-3xl font-bold">S/ {budget.estimatedTotal.toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">Según tu plan actual</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-start justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ahorro potencial</CardTitle><PiggyBank className="size-5 text-amber-600" aria-hidden /></CardHeader>
                <CardContent><p className="font-heading text-3xl font-bold text-amber-700">S/ {budget.savings.toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">Comparando precios</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-start justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Uso del presupuesto</CardTitle><CheckCircle2 className="size-5 text-primary" aria-hidden /></CardHeader>
                <CardContent><div className="flex items-baseline justify-between"><p className="font-heading text-3xl font-bold">{Math.round(budget.usedPercent)}%</p><span className="text-xs font-medium text-primary">{budgetLevelLabels[budget.level]}</span></div><Progress value={progress} className="mt-3 h-2" aria-label={`${Math.round(budget.usedPercent)}% del presupuesto usado`} /></CardContent>
              </Card>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <Card>
              <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Plan de comidas</CardTitle><p className="mt-1 text-sm text-muted-foreground">Una vista rápida de tu semana</p></div><Link href="/menu"><Button variant="ghost" size="sm">Editar plan <ChevronRight data-icon="inline-end" /></Button></Link></CardHeader>
              <CardContent className="overflow-x-auto"><div className="grid min-w-[680px] grid-cols-7 gap-2">{plan.days.map((day) => <div key={day.day} className="rounded-xl border bg-muted/30 p-2.5"><p className="mb-3 text-center text-xs font-bold capitalize text-foreground">{weekdayLabels[day.day].slice(0, 3)}</p><div className="flex flex-col gap-2">{([day.desayuno, day.almuerzo, day.cena]).map((meal) => <div key={meal.id} className="rounded-lg bg-background p-2 shadow-sm"><p className="truncate text-[10px] font-medium text-muted-foreground">{mealTypeLabels[meal.type]}</p><p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug">{meal.name}</p><p className="mt-1 text-[10px] text-muted-foreground">S/ {meal.estimatedCost.toFixed(2)}</p></div>)}</div></div>)}</div></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Próximas comidas</CardTitle><p className="text-sm text-muted-foreground">Lo que sigue en tu plan</p></CardHeader>
              <CardContent className="flex flex-col gap-2">{upcoming.map(({ day, type, meal }) => <div key={`${day}-${type}`} className="flex items-center gap-3 rounded-xl border p-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Utensils className="size-5" aria-hidden /></div><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{day} · {type}</p><p className="truncate text-sm font-semibold">{meal.name}</p></div><span className="text-xs font-medium text-muted-foreground">S/ {meal.estimatedCost.toFixed(2)}</span></div>)}</CardContent>
            </Card>
          </div>

          <section aria-labelledby="recommendations-title"><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-medium text-primary">Ideas para ti</p><h2 id="recommendations-title" className="font-heading text-xl font-bold tracking-tight">Recomendaciones</h2></div><Lightbulb className="size-6 text-amber-500" aria-hidden /></div><div className="grid gap-4 md:grid-cols-3">{recommendations.slice(0, 3).map((recommendation) => <Card key={recommendation.id} className="flex flex-col"><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="text-base leading-snug">{recommendation.title}</CardTitle><Badge variant="outline" className="shrink-0 capitalize">{recommendation.type}</Badge></div></CardHeader><CardContent className="flex flex-1 flex-col"><p className="text-sm leading-relaxed text-muted-foreground">{recommendation.message}</p>{recommendation.actionHref && <Link href={recommendation.actionHref} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{recommendation.actionLabel} <ArrowRight data-icon="inline-end" /></Link>}</CardContent></Card>)}</div></section>

          <section aria-labelledby="quick-title"><h2 id="quick-title" className="mb-4 font-heading text-xl font-bold tracking-tight">Accesos rápidos</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{quickActions.map(({ href, label, icon: Icon, tone }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"><div className={`flex size-10 items-center justify-center rounded-lg ${tone}`}><Icon className="size-5" aria-hidden /></div><span className="flex-1 text-sm font-semibold">{label}</span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>)}</div></section>
        </div>
      </main>
    </div>
  )
}
