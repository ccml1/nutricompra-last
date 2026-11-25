import { describe, expect, it } from 'vitest'
import { budgetSuggestions } from './budget-suggestions'

describe('budgetSuggestions', () => {
  it('parte de la canasta básica: S/ 60 por adulto y S/ 45 por niño a la semana, redondeado a S/ 10', () => {
    // 2 adultos y 1 niño: 2 × 60 + 45 = 165 → 140, 170, 210.
    expect(budgetSuggestions(2, 1).map((s) => s.amount)).toEqual([140, 170, 210])
    // 2 adultos y 2 niños: 210 → 180, 210, 270.
    expect(budgetSuggestions(2, 2).map((s) => s.amount)).toEqual([180, 210, 270])
  })

  it('siempre cuenta al menos un adulto', () => {
    expect(budgetSuggestions(0, 0)).toEqual(budgetSuggestions(1, 0))
  })
})
