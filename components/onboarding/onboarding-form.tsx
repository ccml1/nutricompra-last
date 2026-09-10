'use client'

import { Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  dietaryPreferenceLabels,
  dietaryRestrictionLabels,
} from '@/data/mock-households'
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

export function OnboardingForm() {
  const router = useRouter()
  const completeOnboarding = useAuth((s) => s.completeOnboarding)
  const household = useAuth((s) => s.household)

  const [members, setMembers] = useState(household.members)
  const [children, setChildren] = useState(household.children)
  const [budget, setBudget] = useState(household.weeklyBudget)
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
    if (children > members) {
      setError('El número de niños no puede superar al de integrantes')
      return
    }
    setError(null)
    completeOnboarding({
      ...household,
      members,
      children,
      weeklyBudget: budget,
      preferences,
      restrictions,
    })
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
          <Stepper label="Integrantes" value={members} min={1} max={15} onChange={setMembers} />
          <Stepper label="Niños" value={children} min={0} max={15} onChange={setChildren} />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Presupuesto semanal
              </h2>
              <p className="text-sm text-muted-foreground">Cuánto puedes destinar a las compras.</p>
            </div>
            <span className="font-display text-2xl font-bold text-primary">
              {formatCurrency(budget)}
            </span>
          </div>
          <Slider
            value={[budget]}
            min={20}
            max={500}
            step={5}
            onValueChange={([v]) => setBudget(v)}
            aria-label="Presupuesto semanal"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(20)}</span>
            <span>{formatCurrency(500)}</span>
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
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
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
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
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
          Generar mi plan semanal
        </Button>
      </CardContent>
    </Card>
  )
}
