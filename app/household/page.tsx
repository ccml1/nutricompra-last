'use client'

import { Home, Users } from 'lucide-react'
import { AppSidebar } from '@/components/app/app-sidebar'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/store/use-auth'

export default function HouseholdPage() {
  const household = useAuth((state) => state.household)

  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />
      <main className="lg:pl-64">
        <header className="border-b bg-background/90 px-5 py-5 backdrop-blur lg:px-10">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-primary">Configuración del hogar</p>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Tu hogar, a tu medida</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Actualiza estos datos para que NutriCompra pueda ajustar tu presupuesto y tus comidas.
            </p>
          </div>
        </header>

        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-7 lg:px-10 lg:py-9">
          <Card className="border-primary/20 bg-primary text-primary-foreground">
            <CardHeader className="flex-row items-center gap-3 pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15"><Home className="size-5" aria-hidden /></div>
              <div><CardTitle className="text-base text-primary-foreground">Resumen actual</CardTitle><p className="text-sm text-primary-foreground/75">La información que usa tu plan semanal</p></div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-primary-foreground/10 p-3"><p className="text-xs text-primary-foreground/70">Integrantes</p><p className="mt-1 text-xl font-bold">{household.members}</p></div>
              <div className="rounded-xl bg-primary-foreground/10 p-3"><p className="text-xs text-primary-foreground/70">Niños</p><p className="mt-1 text-xl font-bold">{household.children}</p></div>
              <div className="rounded-xl bg-primary-foreground/10 p-3"><p className="text-xs text-primary-foreground/70">Presupuesto semanal</p><p className="mt-1 text-xl font-bold">S/ {household.weeklyBudget.toFixed(2)}</p></div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="size-5" aria-hidden /></div>
            <div><h2 className="font-heading text-xl font-bold tracking-tight">Editar configuración</h2><p className="text-sm text-muted-foreground">Los cambios se guardan en tu configuración actual.</p></div>
          </div>
          <OnboardingForm mode="settings" />
        </div>
      </main>
    </div>
  )
}
