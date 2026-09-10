'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  MapPin,
  Menu,
  Search,
  Store,
  TrendingDown,
} from 'lucide-react'
import { AppSidebar } from '@/components/app/app-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePlan } from '@/hooks/use-plan'
import { buildShoppingList } from '@/lib/shopping'
import { establishmentsById, mockProductPrices } from '@/data/mock-prices'
import type { FoodCategory, ProductPrice } from '@/types'

const categoryLabels: Record<FoodCategory, string> = {
  frutas: 'Frutas', verduras: 'Verduras', carnes: 'Proteínas', legumbres: 'Legumbres',
  cereales: 'Cereales y granos', lacteos: 'Lácteos', otros: 'Otros',
}

function formatCurrency(value: number) {
  return `S/ ${value.toFixed(2)}`
}

function formatReferenceDate() {
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(2026, 8, 10))
}

function PriceRow({ product, establishmentId }: { product: ProductPrice; establishmentId: string }) {
  const option = product.prices.find((price) => price.establishmentId === establishmentId)
  if (!option) return null
  const establishment = establishmentsById[establishmentId]
  const isBest = product.bestEstablishmentId === establishmentId

  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isBest ? 'border-primary/40 bg-primary/5' : 'bg-background'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${isBest ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}><Store className="size-5" aria-hidden /></div>
        <div className="min-w-0"><p className="font-medium">{establishment?.name}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden /> Lima, Perú</p></div>
      </div>
      <div className="flex items-center justify-between gap-5 sm:justify-end"><div className="text-right"><p className="font-heading text-xl font-bold">{formatCurrency(option.price)}</p><p className="text-xs text-muted-foreground">por {product.unit}</p></div>{isBest && <Badge className="gap-1 whitespace-nowrap"><Check data-icon="inline-start" /> Mejor precio</Badge>}</div>
    </div>
  )
}

export default function PricesPage() {
  const { plan } = usePlan()
  const [query, setQuery] = useState('')
  const shoppingFoodIds = useMemo(() => new Set(buildShoppingList(plan).items.map((item) => item.foodId)), [plan])
  const products = useMemo(() => mockProductPrices.filter((product) => shoppingFoodIds.has(product.foodId)), [shoppingFoodIds])
  const filteredProducts = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase().trim()))
  const lowestTotal = products.reduce((total, product) => total + product.bestPrice, 0)
  const averageTotal = products.reduce((total, product) => total + product.prices.reduce((sum, option) => sum + option.price, 0) / product.prices.length, 0)
  const potentialSavings = products.reduce((total, product) => total + product.highestPrice - product.bestPrice, 0)

  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />
      <main className="lg:pl-64">
        <header className="border-b bg-background/90 px-5 py-5 backdrop-blur lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center gap-3"><Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú"><Menu /></Button><div><Link href="/shopping-list" className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ArrowLeft data-icon="inline-start" /> Volver a la lista</Link><h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Comparador de precios</h1></div></div>
        </header>
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-7 lg:px-10 lg:py-9">
          <section aria-labelledby="prices-intro"><div className="mb-5"><p className="text-sm font-medium text-primary">Compra con más información</p><h2 id="prices-intro" className="font-heading text-xl font-bold tracking-tight">Encuentra el mejor precio para tu lista</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Comparamos precios demostrativos de los establecimientos disponibles para tu plan semanal.</p></div><div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar un producto..." aria-label="Buscar un producto" className="h-11 pl-10" /></div></section>
          <section aria-label="Resumen de precios" className="grid gap-4 sm:grid-cols-3"><Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Precio más bajo</CardTitle></CardHeader><CardContent><p className="font-heading text-2xl font-bold text-primary">{formatCurrency(lowestTotal)}</p><p className="mt-1 text-xs text-muted-foreground">Eligiendo la mejor opción</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Precio promedio</CardTitle></CardHeader><CardContent><p className="font-heading text-2xl font-bold">{formatCurrency(averageTotal)}</p><p className="mt-1 text-xs text-muted-foreground">Entre todos los establecimientos</p></CardContent></Card><Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300"><TrendingDown className="size-4" aria-hidden /> Ahorro potencial</CardTitle></CardHeader><CardContent><p className="font-heading text-2xl font-bold text-amber-800 dark:text-amber-300">{formatCurrency(potentialSavings)}</p><p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">Frente a la alternativa más cara</p></CardContent></Card></section>
          <Card><CardHeader><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Precios de tu lista</CardTitle><p className="mt-1 text-sm text-muted-foreground">{filteredProducts.length} {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}</p></div><Badge variant="outline" className="w-fit gap-1.5"><CalendarDays data-icon="inline-start" /> Referencia: {formatReferenceDate()}</Badge></div></CardHeader><CardContent className="flex flex-col gap-8">{filteredProducts.length > 0 ? filteredProducts.map((product) => <section key={product.foodId} aria-labelledby={`product-${product.foodId}`}><div className="mb-3 flex items-center justify-between gap-3"><div><h3 id={`product-${product.foodId}`} className="font-heading text-lg font-bold">{product.name}</h3><p className="text-sm text-muted-foreground">{categoryLabels[product.category]} · {product.unit}</p></div><Badge variant="secondary">Mejor: {formatCurrency(product.bestPrice)}</Badge></div><div className="flex flex-col gap-2">{product.prices.map((option) => <PriceRow key={option.establishmentId} product={product} establishmentId={option.establishmentId} />)}</div></section>) : <div className="rounded-xl border border-dashed p-10 text-center"><Search className="mx-auto size-8 text-muted-foreground" aria-hidden /><p className="mt-3 font-medium">No encontramos ese producto</p><p className="mt-1 text-sm text-muted-foreground">Prueba con otro nombre de tu lista de compras.</p></div>}</CardContent></Card>
          <p className="text-center text-xs text-muted-foreground">Los precios mostrados son datos mock demostrativos y no representan precios en tiempo real.</p>
        </div>
      </main>
    </div>
  )
}
