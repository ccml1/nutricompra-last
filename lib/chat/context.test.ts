import { describe, expect, it } from 'vitest'
import { mockWeekPlan } from '@/data/mock-plan'
import { buildShoppingList } from '@/lib/shopping'
import { buildChatContext } from './context'

describe('buildChatContext', () => {
  it('resume el menú de cada día (platos con sus kcal y totales), la lista con su total y el presupuesto', () => {
    const plan = { ...mockWeekPlan, budget: 180 }
    const list = buildShoppingList(plan)
    const monday = plan.days[0]

    const context = buildChatContext(plan, list, 152.4)

    expect(context.weeklyBudget).toBe(180)
    expect(context.shoppingTotal).toBe(152.4)
    expect(context.menu).toHaveLength(plan.days.length)
    expect(context.menu[0]).toEqual({
      day: 'Lunes',
      meals: [
        { type: 'Desayuno', name: monday.desayuno.name, kcal: Math.round(monday.desayuno.nutrition.calories) },
        { type: 'Almuerzo', name: monday.almuerzo.name, kcal: Math.round(monday.almuerzo.nutrition.calories) },
        { type: 'Cena', name: monday.cena.name, kcal: Math.round(monday.cena.nutrition.calories) },
      ],
      kcal: Math.round(
        monday.desayuno.nutrition.calories + monday.almuerzo.nutrition.calories + monday.cena.nutrition.calories,
      ),
      proteinG: expect.any(Number),
      carbsG: expect.any(Number),
      fatG: expect.any(Number),
    })
    expect(context.shoppingList[0]).toEqual({ name: list.items[0].name, quantity: list.items[0].quantity })
  })
})
