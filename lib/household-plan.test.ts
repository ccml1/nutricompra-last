import { describe, expect, it } from 'vitest'
import { mockWeekPlan } from '@/data/mock-plan'
import type { Household } from '@/types'
import { summarizePlanBudget } from './budget'
import { adaptPlan, excludedFoods, pantryStaples } from './household-plan'
import { buildShoppingList } from './shopping'

/** La familia de la simulación: 2 adultos y 1 niña, sueldo mínimo, S/ 130 a la semana para comida. */
const rosa: Household = {
  id: 'rosa',
  members: 3,
  children: 1,
  weeklyBudget: 130,
  preferences: ['equilibrada', 'economica'],
  restrictions: ['ninguna'],
  goals: [],
}

const meals = (plan: ReturnType<typeof adaptPlan>) => plan.days.flatMap((day) => [day.desayuno, day.almuerzo, day.cena])

describe('adaptPlan', () => {
  it('ajusta el menú hasta que el gasto de la semana entra en el presupuesto, sin dejarlo monótono', () => {
    const plan = adaptPlan(mockWeekPlan, rosa)
    const budget = summarizePlanBudget(plan)

    expect(budget.estimatedTotal).toBeLessThanOrEqual(130)
    expect(plan.economy).toBe(true)
    // Ningún plato se repite más de 3 veces en la semana.
    const counts = new Map<string, number>()
    for (const meal of meals(plan)) counts.set(meal.id, (counts.get(meal.id) ?? 0) + 1)
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(3)
  })

  it('con presupuesto holgado deja el menú base', () => {
    const plan = adaptPlan(mockWeekPlan, { ...rosa, weeklyBudget: 400 })
    expect(plan.economy).toBe(false)
    expect(meals(plan).map((meal) => meal.id)).toEqual(meals(mockWeekPlan).map((meal) => meal.id))
  })

  it('respeta las restricciones: sin lactosa no hay leche, yogurt ni queso; vegetariano no lleva carne ni pescado', () => {
    const noDairy = adaptPlan(mockWeekPlan, { ...rosa, weeklyBudget: 400, restrictions: ['sin-lactosa'] })
    const veggie = adaptPlan(mockWeekPlan, { ...rosa, weeklyBudget: 400, preferences: ['vegetariana'] })
    const foods = (plan: ReturnType<typeof adaptPlan>) => new Set(meals(plan).flatMap((meal) => meal.ingredients.map((ing) => ing.foodId)))

    for (const id of ['leche', 'yogurt', 'queso-fresco']) expect(foods(noDairy).has(id)).toBe(false)
    for (const id of ['pollo', 'jurel', 'carne-res', 'atun']) expect(foods(veggie).has(id)).toBe(false)
    expect(noDairy.lunchboxes?.every(({ lunchbox }) => lunchbox.ingredients.every((ing) => ing.foodId !== 'queso-fresco'))).toBe(true)
  })

  it('las comidas que la persona eligió a mano se respetan aunque el presupuesto sea ajustado', () => {
    const plan = adaptPlan(mockWeekPlan, { ...rosa, weeklyBudget: 60 }, { 'lunes-almuerzo': 'estofado-res' })
    expect(plan.days[0].almuerzo.id).toBe('estofado-res')
  })

  it('suma loncheras de lunes a viernes por cada niño, y la despensa básica a la lista', () => {
    const plan = adaptPlan(mockWeekPlan, rosa)
    const list = buildShoppingList(plan).items.map((item) => item.name)

    expect(plan.lunchboxes?.map(({ day }) => day)).toEqual(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'])
    expect(plan.lunchboxChildren).toBe(1)
    for (const staple of ['Aceite vegetal', 'Sal', 'Azúcar', 'Ajo', 'Limón']) expect(list).toContain(staple)
    expect(adaptPlan(mockWeekPlan, { ...rosa, members: 2, children: 0 }).lunchboxes).toEqual([])
  })
})

describe('excludedFoods y pantryStaples', () => {
  it('vegano excluye todo lo de origen animal', () => {
    const excluded = excludedFoods({ preferences: ['vegana'], restrictions: ['ninguna'] })
    for (const id of ['pollo', 'huevos', 'leche', 'queso-fresco']) expect(excluded.has(id)).toBe(true)
  })

  it('poca sal reduce la sal y sin azúcar la quita de la despensa', () => {
    const normal = pantryStaples({ preferences: [], restrictions: ['ninguna'] }, 2)
    const careful = pantryStaples({ preferences: [], restrictions: ['poca-sal', 'sin-azucar'] }, 2)
    const salt = (items: typeof normal) => items.find((ing) => ing.foodId === 'sal')!.cost

    expect(salt(careful)).toBeLessThan(salt(normal))
    expect(careful.some((ing) => ing.foodId === 'azucar')).toBe(false)
  })
})
