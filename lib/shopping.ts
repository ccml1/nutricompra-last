import { mockFoods } from '@/data/mock-foods'
import { establishmentsById, mockProductPrices } from '@/data/mock-prices'
import type { ShoppingItem, ShoppingList, WeekPlan } from '@/types'

const foodsById = Object.fromEntries(mockFoods.map((f) => [f.id, f]))
const pricesByFood = Object.fromEntries(
  mockProductPrices.map((p) => [p.foodId, p]),
)

/** Lo que no se vende fraccionado (unidades, latas, atados) se redondea hacia arriba. */
export function formatQuantity(units: number, unit: string): string {
  if (/^(unidad|lata|atado|paquete|bolsa)/.test(unit)) {
    const whole = Math.max(1, Math.ceil(units - 0.05))
    const plural = whole === 1 ? unit : unit.endsWith('d') ? `${unit}es` : `${unit}s`
    return `${whole} ${plural}`
  }
  return `${units.toFixed(1)} ${unit}`
}

/**
 * Deriva una lista de compras agregada a partir del plan semanal: suma el
 * costo de cada alimento usado en todas las comidas y estima la cantidad a
 * comprar según su precio de referencia.
 */
export function buildShoppingList(plan: WeekPlan): ShoppingList {
  const costByFood = new Map<string, number>()
  // Los ingredientes de cada comida son por persona: se compra para todas las porciones del hogar.
  const portions = plan.portions ?? 1

  for (const day of plan.days) {
    for (const meal of [day.desayuno, day.almuerzo, day.cena]) {
      for (const ing of meal.ingredients) {
        costByFood.set(ing.foodId, (costByFood.get(ing.foodId) ?? 0) + ing.cost * portions)
      }
    }
  }

  const items: ShoppingItem[] = [...costByFood.entries()]
    .map(([foodId, totalCost]) => {
      const food = foodsById[foodId]
      if (!food) return null

      const units = totalCost / food.referencePrice
      const price = pricesByFood[foodId]
      const bestUnitPrice = price?.bestPrice ?? food.referencePrice
      const bestEstablishment = price
        ? establishmentsById[price.bestEstablishmentId]?.name ?? 'Mercado'
        : 'Mercado'

      return {
        id: `item-${foodId}`,
        foodId,
        name: food.name,
        category: food.category,
        quantity: formatQuantity(units, food.unit),
        estimatedPrice: Math.round(totalCost * 10) / 10,
        bestPrice: Math.round(units * bestUnitPrice * 10) / 10,
        bestEstablishment,
      } satisfies ShoppingItem
    })
    .filter((i): i is ShoppingItem => i !== null)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  return {
    id: `shopping-${plan.id}`,
    budget: plan.budget,
    items,
  }
}
