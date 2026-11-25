'use client'

import { Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  dietaryPreferenceLabels,
  dietaryRestrictionLabels,
} from '@/data/mock-households'
import { budgetSuggestions, MAX_BUDGET, MIN_BUDGET } from '@/lib/budget-suggestions'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { onboardingSchema } from '@/lib/validations'
import { useAuth } from '@/store/use-auth'
import type { DietaryPreference, DietaryRestriction } from '@/types'

const preferenceOptions = Object.entries(dietaryPreferenceLabels) as [
  DietaryPreference,
  string,
][]
const restrictionOptions = Object.entries(dietaryRestrictionLabels) as [
  DietaryRestriction,
  string,
][]

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Disminuir ${label}`}
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-6 text-center font-display text-lg font-semibold tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function OnboardingForm({ mode = 'onboarding' }: { mode?: 'onboarding' | 'settings' }) {
  const router = useRouter()
  const completeOnboarding = useAuth((s) => s.completeOnboarding)
  const updateHousehold = useAuth((s) => s.updateHousehold)
  const household = useAuth((s) => s.household)

  // El hogar se cuenta como adultos + niños; se guarda el total en `members`.
  const [adults, setAdults] = useState(Math.max(1, household.members - household.children))
  const [children, setChildren] = useState(household.children)
  const members = adults + children
  const [budget, setBudget] = useState(household.weeklyBudget)
  /** Lo que se ve escrito: se puede borrar y reescribir sin que el campo salte. */
  const [budgetText, setBudgetText] = useState(String(household.weeklyBudget))
  /** Al registrarse, el presupuesto sigue la canasta básica del hogar hasta que la persona lo toca. */
  const [budgetTouched, setBudgetTouched] = useState(mode === 'settings')
  const applyBudget = (value: number) => {
    const next = Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, Math.round(value)))
    setBudget(next)
    setBudgetText(String(next))
  }
  const setBudgetValue = (value: number) => {
    setBudgetTouched(true)
    applyBudget(value)
  }
  const resize = (nextAdults: number, nextChildren: number) => {
    setAdults(nextAdults)
    setChildren(nextChildren)
    if (!budgetTouched) applyBudget(budgetSuggestions(nextAdults, nextChildren)[1].amount)
  }
  const suggestions = budgetSuggestions(adults, children)
  const canasta = suggestions[1].amount
  const [preferences, setPreferences] = useState<DietaryPreference[]>(household.preferences)
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>(household.restrictions)
  const [error, setError] = useState<string | null>(null)

  const togglePreference = (p: DietaryPreference) =>
    setPreferences((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const toggleRestriction = (r: DietaryRestriction) =>
    setRestrictions((prev) => {
      if (r === 'ninguna') return ['ninguna']
      const next = prev.includes(r) ? prev.filter((x) => x !== r) : [...prev.filter((x) => x !== 'ninguna'), r]
      return next.length ? next : ['ninguna']
    })

  const handleSubmit = () => {
    const result = onboardingSchema.safeParse({
      members,
      children,
      weeklyBudget: budget,
      preferences,
      restrictions,
    })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa los datos ingresados')
      return
    }
    setError(null)
    const householdChanges = {
      members,
      children,
      weeklyBudget: budget,
      preferences,
      restrictions,
    }
    if (mode === 'settings') {
      updateHousehold(householdChanges)
      toast.success('Configuración guardada correctamente')
      return
    }
    completeOnboarding({ ...household, ...householdChanges })
    toast.success('¡Tu hogar está listo!')
    router.push('/dashboard')
  }

  return (
    <Card className="border-border">
      <CardContent className="flex flex-col gap-8 p-6 sm:p-8">
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Tu hogar</h2>
            <p className="text-sm text-muted-foreground">
              Usaremos esto para calcular porciones y cantidades.
            </p>
          </div>
          <Stepper label="Adultos" value={adults} min={1} max={10} onChange={(value) => resize(value, children)} />
          <Stepper label="Niños (menores de 12)" value={children} min={0} max={10} onChange={(value) => resize(adults, value)} />
          <p className="text-sm text-muted-foreground">
            En total son <span className="font-semibold text-foreground">{members} {members === 1 ? 'persona' : 'personas'}</span>.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Presupuesto semanal
            </h2>
            <p className="text-sm text-muted-foreground">Cuánto puedes gastar en comida cada semana. Elige una sugerencia o ajústalo.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 rounded-full"
              onClick={() => setBudgetValue(budget - 10)}
              disabled={budget <= MIN_BUDGET}
              aria-label="Bajar S/ 10"
            >
              <Minus className="size-4" />
            </Button>
            <label className="relative flex-1">
              <span className="sr-only">Presupuesto semanal en soles</span>
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-display text-lg font-semibold text-muted-foreground">
                S/
              </span>
              <Input
                inputMode="decimal"
                value={budgetText}
                onChange={(event) => {
                  const text = event.currentTarget.value.replace(/[^\d.,]/g, '')
                  setBudgetText(text)
                  setBudgetTouched(true)
                  const value = Number(text.replace(',', '.'))
                  if (Number.isFinite(value) && value > 0) setBudget(value)
                }}
                onBlur={() => setBudgetValue(budget)}
                className="h-14 rounded-2xl pl-12 text-center font-display text-2xl font-bold tabular-nums md:text-2xl"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 rounded-full"
              onClick={() => setBudgetValue(budget + 10)}
              disabled={budget >= MAX_BUDGET}
              aria-label="Subir S/ 10"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <input
            type="range"
            min={50}
            max={1000}
            step={10}
            value={Math.min(1000, Math.max(50, budget))}
            onChange={(event) => setBudgetValue(event.currentTarget.valueAsNumber)}
            aria-label="Deslizar para ajustar el presupuesto"
            className="w-full cursor-pointer accent-primary"
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Sugerido para {adults} {adults === 1 ? 'adulto' : 'adultos'}
              {children > 0 ? ` y ${children} ${children === 1 ? 'niño' : 'niños'}` : ''}, según la canasta básica:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {suggestions.map((suggestion) => {
                const active = Math.round(budget) === suggestion.amount
                return (
                  <button
                    key={suggestion.key}
                    type="button"
                    onClick={() => setBudgetValue(suggestion.amount)}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-center rounded-xl border px-2 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'border-primary bg-secondary text-secondary-foreground' : 'border-border bg-card hover:border-primary/50',
                    )}
                  >
                    <span className="text-xs text-muted-foreground">{suggestion.label}</span>
                    <span className="font-display text-base font-bold tabular-nums">{formatCurrency(suggestion.amount)}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Unos {formatCurrency(budget / Math.max(1, members))} por persona a la semana.
            </p>
            {budget < canasta && (
              <p role="status" className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
                Está por debajo de la canasta básica de tu hogar ({formatCurrency(canasta)}). No te preocupes: armaremos un menú más
                económico, con menestras, huevo y pan del día, para que te alcance comiendo bien.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Preferencias</h2>
            <p className="text-sm text-muted-foreground">Elige una o más. Adaptaremos tu menú.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferenceOptions.map(([value, label]) => {
              const active = preferences.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePreference(value)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Restricciones</h2>
            <p className="text-sm text-muted-foreground">Marca lo que debemos evitar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {restrictionOptions.map(([value, label]) => {
              const active = restrictions.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleRestriction(value)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-secondary text-secondary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <Button size="lg" onClick={handleSubmit}>
          {mode === 'settings' ? 'Guardar cambios' : 'Generar mi plan semanal'}
        </Button>
      </CardContent>
    </Card>
  )
}
