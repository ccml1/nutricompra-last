import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { plateFoods } from './foods'

const embeddings = JSON.parse(
  readFileSync(join(process.cwd(), 'public/models/clip-foods/text-embeddings.json'), 'utf8'),
) as { foods: { name: string; embedding: number[] }[] }

describe('plateFoods', () => {
  it('tiene los 78 alimentos del catálogo TPCA, sin repetir, con porción y rendimiento de cocción', () => {
    expect(plateFoods).toHaveLength(78)
    expect(new Set(plateFoods.map((food) => food.name)).size).toBe(78)
    for (const food of plateFoods) {
      expect(food.portionG).toBeGreaterThan(0)
      expect(food.cookedYield).toBeGreaterThan(0)
    }
  })

  it('los vectores de CLIP son de los alimentos reconocibles, en el mismo orden y normalizados', () => {
    const recognizable = plateFoods.filter((food) => food.label).map((food) => food.name)

    expect(embeddings.foods.map((food) => food.name)).toEqual(recognizable)
    for (const { embedding } of embeddings.foods) {
      expect(embedding).toHaveLength(512)
      expect(Math.hypot(...embedding)).toBeCloseTo(1, 3)
    }
  })
})
