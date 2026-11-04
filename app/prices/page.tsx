'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Menu, Search, SearchX, WifiOff } from 'lucide-react'
import { AppSidebar } from '@/components/app/app-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePlan } from '@/hooks/use-plan'
import { useStoreProducts } from '@/hooks/use-store-products'
import { formatCurrency } from '@/lib/format'
import { pressableClass } from '@/lib/pressable'
import type { StoreOffer, StoreProductGroup } from '@/types'

/** El backend devuelve como máximo 20 productos por búsqueda. */
const MAX_RESULTS = 20

/** Chips visibles antes de "+N más": todas las opciones a la vista, sin scroll escondido. */
const CHIP_LIMIT = 8

/** Columnas fijas: cada tienda siempre en el mismo lugar. */
const stores = [
  { code: 'plazavea', name: 'Plaza Vea' },
  { code: 'wong', name: 'Wong' },
  { code: 'metro', name: 'Metro' },
]

/**
 * Cómo buscar en las tiendas un alimento de la lista cuando su nombre no es el
 * que ellas usan: ninguna escribe "enlatado", dicen "Atún en trozos… lata".
 */
const storeSearchTerms: Record<string, string> = { 'Atún enlatado': 'Atún' }

const dayFormatter = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' })
const dayOf = (offer: StoreOffer) => dayFormatter.format(new Date(offer.observedAt))
const price = (offer: StoreOffer) => formatCurrency(offer.priceCents / 100)

/** Alimento de la lista: un chip con relieve para que se note que se puede tocar. */
function ListChip({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`min-h-9 whitespace-nowrap rounded-full px-4 text-sm font-medium ${pressableClass} ${
        selected
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
          : 'bg-card text-foreground/80 shadow-sm ring-1 ring-border/70 hover:text-foreground hover:shadow-md'
      }`}
    >
      {label}
    </button>
  )
}

/** Cómo se ve cada precio de un producto: el más barato, todos iguales o uno más. */
type PriceTone = 'best' | 'same' | 'plain'

/** Un precio con relieve suave: se toca para abrir la ficha del producto en la tienda. */
function PriceTile({ offer, storeName, tone, showDay }: { offer?: StoreOffer; storeName: string; tone: PriceTone; showDay: boolean }) {
  if (!offer) {
    return (
      <span className="flex min-h-12 items-center justify-center text-base text-muted-foreground/40" aria-label={`${storeName}: no lo vende`}>
        —
      </span>
    )
  }
  const day = dayOf(offer)
  const label = tone === 'best' ? 'Mejor precio' : tone === 'same' ? 'Mismo precio' : null
  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Ver en ${storeName}`}
      aria-label={`${storeName}: ${price(offer)}${label ? `, ${label.toLowerCase()}` : ''}, consultado el ${day}. Abre la ficha en la tienda`}
      className={`group relative flex min-h-12 flex-col items-center justify-center rounded-xl px-2 py-1.5 ${pressableClass} ${
        tone === 'best'
          ? 'bg-primary/10 text-primary ring-1 ring-primary/25 hover:shadow-md hover:shadow-primary/15'
          : 'bg-muted/50 text-foreground hover:bg-card hover:shadow-md hover:ring-1 hover:ring-border/70'
      }`}
    >
      <ArrowUpRight className="absolute right-1.5 top-1.5 size-3 opacity-0 transition-opacity group-hover:opacity-60 motion-reduce:transition-none" aria-hidden="true" />
      <span className="text-base font-semibold tabular-nums sm:text-[17px]">{price(offer)}</span>
      {label && <span className={`whitespace-nowrap text-[11px] font-medium ${tone === 'best' ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>}
      {showDay && <span className="text-[11px] text-muted-foreground">{day}</span>}
    </a>
  )
}

/** Precio de cada tienda en orden fijo, con su tono: si todas cobran lo mismo, nadie es "mejor". */
function priceTiles(product: StoreProductGroup) {
  const allSame = product.offers.length > 1 && product.offers.every((offer) => offer.priceCents === product.offers[0].priceCents)
  return stores.map((store) => {
    const offer = product.offers.find((candidate) => candidate.store === store.code)
    const tone: PriceTone = allSame ? 'same' : offer?.isBest ? 'best' : 'plain'
    return { store, offer, tone }
  })
}

function LoadingRows() {
  return (
    <div aria-hidden="true" className="divide-y divide-border/60">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none sm:w-[40%]" />
          <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-3">
            {stores.map((store) => (
              <div key={store.code} className="h-12 animate-pulse rounded-xl bg-muted/70 motion-reduce:animate-none" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Message({ icon: Icon, children }: { icon: typeof Search; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="max-w-xs text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

export default function PricesPage() {
  const { shoppingList } = usePlan()
  const listFoods = [...new Set(shoppingList.items.map((item) => storeSearchTerms[item.name] ?? item.name))]
  // CA1: se empieza por el primer alimento de la lista; sin lista, solo el buscador.
  const [query, setQuery] = useState(() => listFoods[0] ?? '')
  const [showAllChips, setShowAllChips] = useState(false)
  const { state, retry } = useStoreProducts(query)
  const text = query.trim()

  const visibleFoods = showAllChips ? listFoods : listFoods.slice(0, CHIP_LIMIT)
  const hiddenCount = listFoods.length - CHIP_LIMIT

  const products = state.status === 'ready' ? state.products : []
  // Si todos los precios son del mismo día, la fecha se dice una vez; si no, va en cada precio.
  const days = new Set(products.flatMap((product) => product.offers.map(dayOf)))
  const sharedDay = days.size === 1 ? [...days][0] : null

  const status =
    state.status === 'loading'
      ? 'Buscando precios…'
      : state.status === 'ready'
        ? `${products.length} ${products.length === 1 ? 'producto' : 'productos'} para ${text}`
        : state.status === 'error'
          ? 'No se pudieron cargar los precios'
          : ''

  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />
      <main className="lg:pl-64">
        <header className="border-b bg-background/90 px-5 py-5 backdrop-blur lg:px-10">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú">
              <Menu data-icon="inline-start" />
            </Button>
            <div>
              <Link href="/shopping-list" className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <ArrowLeft data-icon="inline-start" /> Volver a la lista
              </Link>
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Comparador de precios</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Plaza Vea, Wong y Metro</p>
            </div>
          </div>
        </header>

        {/* Mismo margen que el encabezado, para que título y contenido queden alineados. */}
        <div className="px-5 py-6 sm:py-8 lg:px-10">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Busca un alimento"
                  aria-label="Buscar un alimento"
                  className="h-12 rounded-2xl border-transparent bg-card pl-12 text-base shadow-sm ring-1 ring-border/70 sm:h-14 md:text-base dark:bg-card"
                />
              </div>

              {listFoods.length > 0 && (
                <div>
                  <p id="list-foods-label" className="mb-2 text-xs font-medium text-muted-foreground">
                    De tu lista de compras
                  </p>
                  {/* Todas las opciones a la vista: se acomodan en filas, sin scroll escondido. */}
                  <div role="group" aria-labelledby="list-foods-label" className="flex flex-wrap gap-2">
                    {visibleFoods.map((name) => (
                      <ListChip key={name} label={name} selected={query === name} onSelect={() => setQuery(name)} />
                    ))}
                    {hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllChips((value) => !value)}
                        aria-expanded={showAllChips}
                        className={`min-h-9 whitespace-nowrap rounded-full px-4 text-sm font-medium text-primary ring-1 ring-primary/30 hover:bg-primary/5 ${pressableClass}`}
                      >
                        {showAllChips ? 'Ver menos' : `+${hiddenCount} más`}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <section aria-label="Precios" aria-busy={state.status === 'loading'} className="overflow-clip rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
              {/* Región viva que existe desde el inicio: los lectores de pantalla anuncian cuando su texto cambia. */}
              <p role="status" className="sr-only">{status}</p>

              {state.status === 'ready' && products.length > 0 && (
                <>
                  <div className="flex items-baseline justify-between gap-3 px-4 py-4 sm:px-6">
                    <h2 className="text-base font-semibold">
                      {products.length} {products.length === 1 ? 'producto' : 'productos'}
                    </h2>
                    {sharedDay && <span className="text-xs text-muted-foreground">Consultados el {sharedDay}</span>}
                  </div>

                  {/* Escritorio: tabla de verdad, con la tienda como encabezado de cada columna. */}
                  <table className="hidden w-full sm:table">
                    <thead>
                      <tr className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th scope="col" className="py-3 pl-6 pr-4 text-left font-semibold">Producto</th>
                        {stores.map((store) => (
                          <th key={store.code} scope="col" className="w-[17%] px-1.5 py-3 text-center font-semibold">{store.name}</th>
                        ))}
                        <th aria-hidden="true" className="w-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {products.map((product) => (
                        <tr key={product.groupKey}>
                          <th scope="row" className="py-3.5 pl-6 pr-4 text-left text-[15px] font-medium leading-snug">
                            <span className="line-clamp-2">{product.name}</span>
                          </th>
                          {priceTiles(product).map(({ store, offer, tone }) => (
                            <td key={store.code} className="px-1.5 py-3">
                              <PriceTile offer={offer} storeName={store.name} tone={tone} showDay={!sharedDay} />
                            </td>
                          ))}
                          <td aria-hidden="true" />
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Celular: tarjetas; los nombres de las tiendas quedan fijos arriba al bajar. */}
                  <div className="sm:hidden">
                    <div aria-hidden="true" className="sticky top-0 z-10 grid grid-cols-3 gap-2 bg-muted/80 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                      {stores.map((store) => (
                        <span key={store.code}>{store.name}</span>
                      ))}
                    </div>
                    <ul className="divide-y divide-border/60">
                      {products.map((product) => (
                        <li key={product.groupKey} className="px-4 py-4">
                          <p className="line-clamp-2 text-[15px] font-medium leading-snug">{product.name}</p>
                          <div className="mt-2.5 grid grid-cols-3 gap-2">
                            {priceTiles(product).map(({ store, offer, tone }) => (
                              <PriceTile key={store.code} offer={offer} storeName={store.name} tone={tone} showDay={!sharedDay} />
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {state.status === 'idle' && <Message icon={Search}>Escribe un alimento para ver sus precios.</Message>}
              {state.status === 'loading' && <LoadingRows />}
              {state.status === 'error' && (
                <Message icon={WifiOff}>
                  No pudimos cargar los precios.{' '}
                  <button type="button" onClick={retry} className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline">
                    Reintentar
                  </button>
                </Message>
              )}
              {state.status === 'ready' && products.length === 0 && (
                <Message icon={SearchX}>No encontramos productos para “{text}”. Prueba con otro nombre.</Message>
              )}
            </section>

            {state.status === 'ready' && products.length === MAX_RESULTS && (
              <p className="-mt-3 px-1 text-xs text-muted-foreground">Mostramos los 20 primeros. Escribe algo más específico para afinar.</p>
            )}

            <p className="px-4 text-center text-xs leading-relaxed text-muted-foreground">
              Precios consultados en la web de cada tienda. El precio final, el stock y la entrega dependen de la tienda; no incluyen descuentos con tarjeta.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
