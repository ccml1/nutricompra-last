import type { Establishment, EstablishmentPrice, ProductPrice } from '@/types'
import { mockFoods } from './mock-foods'

export const establishments: Establishment[] = [
  { id: 'mercado', name: 'Mercado de Surquillo', type: 'mercado' },
  { id: 'bodega', name: 'Bodega Doña Rosa', type: 'bodega' },
  { id: 'super-a', name: 'Supermercado Metro', type: 'supermercado' },
  { id: 'super-b', name: 'Supermercado Tottus', type: 'supermercado' },
]

export const establishmentsById: Record<string, Establishment> =
  Object.fromEntries(establishments.map((e) => [e.id, e]))

/**
 * Multiplicadores ficticios por establecimiento respecto al precio de
 * referencia del alimento. El mercado suele ser el más económico y el
 * supermercado el más caro.
 */
const priceFactors: Record<string, number> = {
  mercado: 0.9,
  bodega: 1.08,
  'super-a': 1.15,
  'super-b': 1.05,
}

const round = (value: number) => Math.round(value * 10) / 10

/** Alimentos que se comparan por establecimiento en el MVP. */
const comparedFoodIds = [
  'arroz',
  'pollo',
  'huevos',
  'lentejas',
  'frijoles',
  'leche',
  'papa',
  'tomate',
  'zanahoria',
  'platano',
  'manzana',
  'aceite',
  'fideos',
  'quinua',
]

export const mockProductPrices: ProductPrice[] = comparedFoodIds
  .map((foodId) => {
    const food = mockFoods.find((f) => f.id === foodId)
    if (!food) return null

    const prices: EstablishmentPrice[] = establishments.map((e) => ({
      establishmentId: e.id,
      price: round(food.referencePrice * (priceFactors[e.id] ?? 1)),
    }))

    const sorted = [...prices].sort((a, b) => a.price - b.price)
    const best = sorted[0]
    const highest = sorted[sorted.length - 1]

    return {
      foodId: food.id,
      name: food.name,
      category: food.category,
      unit: food.unit,
      prices,
      bestPrice: best.price,
      bestEstablishmentId: best.establishmentId,
      highestPrice: highest.price,
    } satisfies ProductPrice
  })
  .filter((p): p is ProductPrice => p !== null)
