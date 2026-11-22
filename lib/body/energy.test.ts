import { describe, expect, it } from 'vitest'
import { bodyMassIndex, dailyNeeds, menuCoverage, restingKcal } from './energy'

describe('restingKcal (Mifflin-St Jeor)', () => {
  it('calcula el gasto en reposo de hombres y mujeres', () => {
    // 10 × 70 + 6.25 × 175 − 5 × 30 + 5 = 1648.75
    expect(restingKcal('male', 70, 175, 30)).toBeCloseTo(1648.75)
    // 10 × 60 + 6.25 × 160 − 5 × 34 − 161 = 1269
    expect(restingKcal('female', 60, 160, 34)).toBeCloseTo(1269)
  })
})

describe('bodyMassIndex', () => {
  it('da el IMC con la categoría de la OMS', () => {
    expect(bodyMassIndex(70, 175).value).toBeCloseTo(22.86, 2)
    expect(bodyMassIndex(70, 175).label).toBe('Peso saludable')
    expect(bodyMassIndex(85, 170).label).toBe('Sobrepeso')
    expect(bodyMassIndex(100, 165).label).toBe('Obesidad')
    expect(bodyMassIndex(48, 170).label).toBe('Bajo peso')
  })
})

describe('dailyNeeds y menuCoverage', () => {
  it('multiplica el reposo por la actividad, pide 0.8 a 1.2 g de proteína por kg y compara con el menú', () => {
    const needs = dailyNeeds('female', 60, 160, 34, 'moderate')

    expect(needs.kcal).toBeCloseTo(1269 * 1.55)
    expect(needs.proteinMinG).toBeCloseTo(48)
    expect(needs.proteinMaxG).toBeCloseTo(72)

    const coverage = menuCoverage(needs, { calories: 1574, protein: 60 })
    expect(Math.round(coverage.kcalPct)).toBe(80)
    expect(Math.round(coverage.proteinPct)).toBe(125)
  })
})
