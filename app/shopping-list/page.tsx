'use client'

import Link from 'next/link'
import { ArrowLeft, Check, CircleDollarSign, Menu, ShoppingBasket, Wallet } from 'lucide-react'
import { AppSidebar } from '@/components/app/app-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { usePlan } from '@/hooks/use-plan'
import { summarizeShoppingBudget } from '@/lib/budget'
import { useShopping } from '@/store/use-shopping'
import type { FoodCategory, ShoppingItem } from '@/types'

const categoryLabels: Record<FoodCategory, string> = {
  frutas: 'Frutas',
  verduras: 'Verduras',
  carnes: 'Proteínas',
  legumbres: 'Legumbres',
  cereales: 'Cereales y granos',
  lacteos: 'Lácteos',
  otros: 'Otros',
}

const categoryOrder: FoodCategory[] = ['frutas', 'verduras', 'carnes', 'legumbres', 'cereales', 'lacteos', 'otros']

function formatCurrency(value: number) {
  return `S/ ${value.toFixed(2)}`
}

export default function ShoppingListPage() {
  const { shoppingList } = usePlan()
  const { checked, toggle } = useShopping()
  const summary = summarizeShoppingBudget(shoppingList)
  const purchasedCount = shoppingList.items.filter((item) => checked[item.id]).length
  const progress = shoppingList.items.length ? (purchasedCount / shoppingList.items.length) * 100 : 0
  const groupedItems = categoryOrder
    .map((category) => ({ category, items: shoppingList.items.filter((item) => item.category === category) }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />
      <main className="lg:pl-64">
        <header className="border-b bg-background/90 px-5 py-5 backdrop-blur lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú"><Menu data-icon="inline-start" /></Button>
              <div>
                <Link href="/dashboard" className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ArrowLeft data-icon="inline-start" /> Volver al resumen</Link>
                <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Lista de compras</h1>
              </div>
            </div>
            <Badge variant="secondary" className="hidden gap-1.5 px-3 py-1.5 sm:flex"><ShoppingBasket data-icon="inline-start" /> {purchasedCount} de {shoppingList.items.length} comprados</Badge>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-7 lg:px-10 lg:py-9">
          <section aria-labelledby="shopping-summary-title">
            <div className="mb-4"><p className="text-sm font-medium text-primary">Tu compra semanal</p><h2 id="shopping-summary-title" className="font-heading text-xl font-bold tracking-tight">Todo lo que necesitas para tu plan</h2></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-primary/20 bg-primary text-primary-foreground"><CardHeader className="flex-row items-start justify-between pb-2"><CardTitle className="text-sm font-medium text-primary-foreground/80">Presupuesto semanal</CardTitle><Wallet className="size-5 text-primary-foreground/70" aria-hidden /></CardHeader><CardContent><p className="font-heading text-3xl font-bold">{formatCurrency(summary.budget)}</p><p className="mt-1 text-xs text-primary-foreground/70">Para todo el hogar</p></CardContent></Card>
              <Card><CardHeader className="flex-row items-start justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Costo estimado</CardTitle><ShoppingBasket className="size-5 text-muted-foreground" aria-hidden /></CardHeader><CardContent><p className="font-heading text-3xl font-bold">{formatCurrency(summary.estimatedTotal)}</p><p className="mt-1 text-xs text-muted-foreground">Según tu plan actual</p></CardContent></Card>
              <Card><CardHeader className="flex-row items-start justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Monto restante</CardTitle><CircleDollarSign className="size-5 text-primary" aria-hidden /></CardHeader><CardContent><p className={`font-heading text-3xl font-bold ${summary.remaining < 0 ? 'text-destructive' : 'text-primary'}`}>{formatCurrency(summary.remaining)}</p><p className="mt-1 text-xs text-muted-foreground">Después de esta compra</p></CardContent></Card>
              <Card><CardHeader className="flex-row items-start justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto utilizado</CardTitle><Check className="size-5 text-primary" aria-hidden /></CardHeader><CardContent><p className="font-heading text-3xl font-bold">{Math.round(summary.usedPercent)}%</p><Progress value={Math.min(summary.usedPercent, 100)} className="mt-3 h-2" aria-label={`${Math.round(summary.usedPercent)}% del presupuesto utilizado`} /></CardContent></Card>
            </div>
          </section>

          <Card>
            <CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>Progreso de compra</CardTitle><p className="mt-1 text-sm text-muted-foreground">Marca cada producto conforme lo agregues al carrito.</p></div><span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span></div><Progress value={progress} className="h-2" aria-label={`${Math.round(progress)}% de productos comprados`} /></CardHeader>
            <CardContent className="flex flex-col gap-7">
              {groupedItems.map(({ category, items }) => <section key={category} aria-labelledby={`category-${category}`}><div className="mb-3 flex items-center justify-between border-b pb-2"><h3 id={`category-${category}`} className="font-heading font-bold">{categoryLabels[category]}</h3><span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'producto' : 'productos'}</span></div><div className="flex flex-col gap-2">{items.map((item: ShoppingItem) => <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 ${checked[item.id] ? 'bg-muted/40' : 'bg-background'}`}><Checkbox checked={Boolean(checked[item.id])} onCheckedChange={() => toggle(item.id)} aria-label={`Marcar ${item.name} como comprado`} /><div className="min-w-0 flex-1"><p className={`font-medium ${checked[item.id] ? 'text-muted-foreground line-through' : ''}`}>{item.name}</p><p className="text-sm text-muted-foreground">{item.quantity}</p></div><div className="text-right"><p className="font-semibold">{formatCurrency(item.estimatedPrice)}</p><p className="text-xs text-muted-foreground">estimado</p></div></label>)}</div></section>)}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
