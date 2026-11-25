import { describe, expect, it } from 'vitest'
import { budgetSuggestions } from './budget-suggestions'

describe('budgetSuggestions', () => {
  it('sugiere montos ajustado, recomendado y holgado según adultos y niños, redondeados a S/ 10', () => {
    // 4 integrantes con 2 niños: 2 × 50 + 2 × 35 = 170.
    expect(budgetSuggestions(4, 2).map((s) => s.amount)).toEqual([140, 170, 220])
    // 1 adulto: 50 → 40, 50, 70 (65 se redondea a 70).
    expect(budgetSuggestions(1, 0).map((s) => s.amount)).toEqual([40, 50, 70])
  })

  it('no cuenta más niños que integrantes', () => {
    expect(budgetSuggestions(2, 5)).toEqual(budgetSuggestions(2, 2))
  })
})
