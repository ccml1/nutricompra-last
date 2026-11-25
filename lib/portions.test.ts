import { describe, expect, it } from 'vitest'
import { mockWeekPlan } from '@/data/mock-plan'
import { summarizePlanBudget } from './budget'
import { householdPortions } from './portions'
import { buildShoppingList, formatQuantity } from './shopping'

describe('householdPortions', () => {
  it('cuenta 1 porción por adulto y 0.75 por niño', () => {
    expect(householdPortions({ members: 3, children: 1 })).toBe(2.75)
    expect(householdPortions({ members: 4, children: 2 })).toBe(3.5)
    expect(householdPortions({ members: 1, children: 0 })).toBe(1)
  })

  it('siempre hay al menos un adulto, aunque los datos digan que todos son niños', () => {
    expect(householdPortions({ members: 2, children: 2 })).toBe(1 + 2 * 0.75)
  })
})

describe('el plan para todo el hogar', () => {
  it('multiplica el gasto de la semana por las porciones del hogar', () => {
    const one = summarizePlanBudget({ ...mockWeekPlan, budget: 130 }).estimatedTotal
    const family = summarizePlanBudget({ ...mockWeekPlan, budget: 130, portions: 2.75 }).estimatedTotal

    expect(family).toBeCloseTo(one * 2.75, 0)
  })

  it('la lista de compras pide cantidades para todo el hogar', () => {
    const rice = (portions?: number) =>
      buildShoppingList({ ...mockWeekPlan, portions }).items.find((item) => item.name === 'Arroz')!

    expect(rice(2.75).estimatedPrice).toBeCloseTo(rice().estimatedPrice * 2.75, 0)
    expect(parseFloat(rice(2.75).quantity)).toBeGreaterThan(parseFloat(rice().quantity) * 2.5)
  })

  it('lo que se vende por unidad se redondea hacia arriba', () => {
    expect(formatQuantity(0.5, 'unidad')).toBe('1 unidad')
    expect(formatQuantity(5.4, 'unidad')).toBe('6 unidades')
    expect(formatQuantity(1.2, 'atado')).toBe('2 atados')
    expect(formatQuantity(1.64, 'kg')).toBe('1.6 kg')
  })
})
