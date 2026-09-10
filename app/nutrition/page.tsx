'use client'

import { useMemo, useState } from 'react'
import { Apple, Beef, Carrot, ChevronRight, CircleDot, Fish, Search, Wheat } from 'lucide-react'
import { mockFoods, foodCategoryLabels } from '@/data/mock-foods'
import { mockMeals } from '@/data/mock-meals'
import { usePlan } from '@/hooks/use-plan'
import { dayNutrition } from '@/lib/nutrition'
import type { Food, Meal, Nutrition } from '@/types'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const nutritionItems = [
  { key: 'calories', label: 'Calorías', unit: 'kcal', color: 'bg-amber-500' },
  { key: 'protein', label: 'Proteínas', unit: 'g', color: 'bg-emerald-500' },
  { key: 'carbs', label: 'Carbohidratos', unit: 'g', color: 'bg-sky-500' },
  { key: 'fats', label: 'Grasas', unit: 'g', color: 'bg-violet-500' },
  { key: 'fiber', label: 'Fibra', unit: 'g', color: 'bg-orange-500' },
] as const

const categoryIcons = {
  cereales: Wheat,
  legumbres: CircleDot,
  carnes: Beef,
  frutas: Apple,
  verduras: Carrot,
  lacteos: CircleDot,
  otros: Fish,
} as const

function NutritionGrid({ nutrition }: { nutrition: Nutrition }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {nutritionItems.map((item) => (
        <div key={item.key} className="rounded-xl bg-muted/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className={`size-2 rounded-full ${item.color}`} aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
          <p className="text-lg font-semibold tracking-tight">
            {Math.round(nutrition[item.key] * 10) / 10} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

function FoodResult({ food, selected, onSelect }: { food: Food; selected: boolean; onSelect: () => void }) {
  const Icon = categoryIcons[food.category]
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/60 ${selected ? 'border-primary bg-primary/5' : 'border-border/70'}`}
      aria-pressed={selected}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon data-icon="inline-start" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{food.name}</span>
        <span className="block text-xs text-muted-foreground">{foodCategoryLabels[food.category]} · por 100 g</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}

function MealResult({ meal, selected, onSelect }: { meal: Meal; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/60 ${selected ? 'border-primary bg-primary/5' : 'border-border/70'}`}
      aria-pressed={selected}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><Apple data-icon="inline-start" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{meal.name}</span>
        <span className="block text-xs text-muted-foreground">{meal.type} · porción individual</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}

export default function NutritionPage() {
  const { plan } = usePlan()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('arroz-pollo')
  const [selectedKind, setSelectedKind] = useState<'food' | 'meal'>('meal')

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const foods = mockFoods.filter((food) => !normalized || food.name.toLowerCase().includes(normalized))
    const meals = mockMeals.filter((meal) => !normalized || meal.name.toLowerCase().includes(normalized))
    return { foods, meals }
  }, [query])

  const selectedFood = selectedKind === 'food' ? mockFoods.find((food) => food.id === selectedId) : undefined
  const selectedMeal = selectedKind === 'meal' ? mockMeals.find((meal) => meal.id === selectedId) : undefined
  const selectedNutrition = selectedFood?.nutrition ?? selectedMeal?.nutrition
  const weeklyAverage = useMemo(() => {
    const total = plan.days.reduce((acc, day) => ({
      calories: acc.calories + dayNutrition(day).calories,
      protein: acc.protein + dayNutrition(day).protein,
      carbs: acc.carbs + dayNutrition(day).carbs,
      fats: acc.fats + dayNutrition(day).fats,
      fiber: acc.fiber + dayNutrition(day).fiber,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 })
    const days = plan.days.length || 1
    return { calories: total.calories / days, protein: total.protein / days, carbs: total.carbs / days, fats: total.fats / days, fiber: total.fiber / days }
  }, [plan])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-medium text-primary">Decisiones más informadas</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Información nutricional</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Consulta los nutrientes de tus alimentos y comidas para planificar mejor tu semana.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Buscar alimento o comida</CardTitle>
            <CardDescription>Los alimentos se muestran por cada 100 g.</CardDescription>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. arroz, lentejas..." aria-label="Buscar alimento o comida" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="flex max-h-[520px] flex-col gap-5 overflow-y-auto">
            <section aria-labelledby="foods-heading">
              <h2 id="foods-heading" className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alimentos ({results.foods.length})</h2>
              <div className="flex flex-col gap-2">{results.foods.map((food) => <FoodResult key={food.id} food={food} selected={selectedKind === 'food' && selectedId === food.id} onSelect={() => { setSelectedKind('food'); setSelectedId(food.id) }} />)}</div>
            </section>
            <section aria-labelledby="meals-heading">
              <h2 id="meals-heading" className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comidas ({results.meals.length})</h2>
              <div className="flex flex-col gap-2">{results.meals.map((meal) => <MealResult key={meal.id} meal={meal} selected={selectedKind === 'meal' && selectedId === meal.id} onSelect={() => { setSelectedKind('meal'); setSelectedId(meal.id) }} />)}</div>
            </section>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardDescription>{selectedFood ? `${foodCategoryLabels[selectedFood.category]} · referencia por 100 g` : 'Comida completa · porción individual'}</CardDescription>
              <CardTitle className="text-2xl">{selectedFood?.name ?? selectedMeal?.name ?? 'Selecciona una opción'}</CardTitle>
            </CardHeader>
            <CardContent>{selectedNutrition ? <NutritionGrid nutrition={selectedNutrition} /> : <p className="text-muted-foreground">Selecciona un alimento o comida para ver sus datos.</p>}</CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Promedio diario de tu plan</CardTitle><CardDescription>Resumen calculado a partir de las comidas de esta semana.</CardDescription></CardHeader>
            <CardContent><NutritionGrid nutrition={weeklyAverage} /></CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader><CardTitle>Usa esta información para planificar</CardTitle><CardDescription>Compara opciones del menú y elige las que mejor se ajusten a tus preferencias y presupuesto.</CardDescription></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Los valores son aproximados y corresponden a los datos demostrativos de NutriCompra. No sustituyen orientación profesional.</p></CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
