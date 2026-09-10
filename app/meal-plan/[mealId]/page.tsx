'use client'

import Link from 'next/link'
import { ArrowLeft, CircleDollarSign, Clock3, Menu, Replace, Utensils } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AppSidebar } from '@/components/app/app-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockMealsById } from '@/data/mock-meals'
import { mealTypeLabels } from '@/data/mock-plan'
import { usePlan } from '@/hooks/use-plan'
import { findMealSlot, getMealReplacementCandidates } from '@/lib/recommendations'
import { useMealPlan } from '@/store/use-meal-plan'
import type { MealType, Weekday } from '@/types'

const healthStyles = {
  alto: 'border-primary/20 bg-primary/10 text-primary',
  medio: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  bajo: 'border-destructive/20 bg-destructive/10 text-destructive',
} as const

const nutritionItems = [
  { key: 'calories', label: 'Calorías', unit: 'kcal' },
  { key: 'protein', label: 'Proteínas', unit: 'g' },
  { key: 'carbs', label: 'Carbohidratos', unit: 'g' },
  { key: 'fats', label: 'Grasas', unit: 'g' },
  { key: 'fiber', label: 'Fibra', unit: 'g' },
] as const

export default function MealDetailPage() {
  const params = useParams<{ mealId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { plan } = usePlan()
  const replaceMeal = useMealPlan((state) => state.replaceMeal)
  const meal = mockMealsById[params.mealId]
  const slot = meal ? findMealSlot(plan, meal.id, searchParams.get('day') ?? undefined, searchParams.get('type') as MealType | undefined) : null
  const candidates = meal ? getMealReplacementCandidates(meal, plan) : []
  const replacement = candidates[0]

  if (!meal) {
    return (
      <div className="min-h-screen bg-muted/30">
        <AppSidebar />
        <main className="lg:pl-64">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-5 py-20 text-center lg:px-10">
            <p className="text-sm font-medium text-primary">Plan semanal</p>
            <h1 className="font-heading text-3xl font-bold">No encontramos esa comida</h1>
            <p className="max-w-md text-muted-foreground">La comida que buscas ya no está disponible en este plan.</p>
            <Button asChild>
              <Link href="/meal-plan">Volver al plan semanal</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />
      <main className="lg:pl-64">
        <header className="border-b bg-background/90 px-5 py-5 backdrop-blur lg:px-10">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú">
                <Menu data-icon="inline-start" />
              </Button>
              <Link href="/meal-plan" className="hidden items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:flex">
                <ArrowLeft data-icon="inline-start" /> Plan semanal
              </Link>
              <span className="hidden text-muted-foreground sm:block">/</span>
              <p className="truncate text-sm font-medium">Detalle de comida</p>
            </div>
            <Badge variant="secondary">{mealTypeLabels[meal.type]}</Badge>
          </div>
        </header>

        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-7 lg:px-10 lg:py-9">
          <Link href="/meal-plan" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline sm:hidden">
            <ArrowLeft data-icon="inline-start" /> Volver al plan semanal
          </Link>

          <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <Card className="overflow-hidden border-primary/20">
              <div className="bg-primary px-6 py-7 text-primary-foreground sm:px-8 sm:py-9">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground/15">
                      <Utensils className="size-5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-foreground/75">{mealTypeLabels[meal.type]}</p>
                      <p className="text-xs text-primary-foreground/65">Porción individual</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground">
                    Nutrición {meal.healthScore}
                  </Badge>
                </div>
                <h1 className="mt-7 max-w-xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">{meal.name}</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">{meal.description}</p>
              </div>
              <CardContent className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                <div className="flex items-center gap-3">
                  <CircleDollarSign className="size-5 text-primary" aria-hidden />
                  <div><p className="text-xs text-muted-foreground">Costo estimado</p><p className="font-heading text-2xl font-bold">S/ {meal.estimatedCost.toFixed(2)}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock3 className="size-5 text-primary" aria-hidden />
                  <div><p className="text-xs text-muted-foreground">Preparación</p><p className="font-semibold">Lista para planificar</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-between">
              <CardHeader><CardTitle className="text-base">¿Quieres cambiarla?</CardTitle><p className="text-sm text-muted-foreground">Elige otra opción para este momento del día.</p></CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  disabled={!replacement || !slot}
                  onClick={() => {
                    if (!replacement || !slot) return
                    replaceMeal(slot.day as Weekday, slot.mealType, replacement.id)
                    router.replace(`/meal-plan/${replacement.id}?day=${slot.day}&type=${slot.mealType}`)
                  }}
                >
                  <Replace data-icon="inline-start" /> Reemplazar comida
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {replacement ? `Te sugerimos: ${replacement.name}` : 'No encontramos otra opción compatible.'}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Ingredientes y cantidades</CardTitle><p className="text-sm text-muted-foreground">Lo que necesitas para preparar esta porción.</p></CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y">
                  {meal.ingredients.map((ingredient) => (
                    <li key={ingredient.foodId} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <span className="font-medium">{ingredient.name}</span>
                      <span className="shrink-0 text-sm text-muted-foreground">{ingredient.quantity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Información nutricional</CardTitle><p className="text-sm text-muted-foreground">Valores estimados por porción.</p></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                {nutritionItems.map((item) => (
                  <div key={item.key} className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 font-heading text-xl font-bold">{meal.nutrition[item.key]} <span className="text-xs font-medium text-muted-foreground">{item.unit}</span></p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
