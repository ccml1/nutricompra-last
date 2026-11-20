import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ingredientNameEs } from './ingredients-es'
import { NUTRIENT_KEYS, readPlate, scaleToPlateWeight, type PlateConfig, type RawPlateOutputs } from './readout'

// Config original del modelo y salida del script oficial (predict.py) para dos fotos reales.
const config: PlateConfig = JSON.parse(
  readFileSync(join(process.cwd(), 'public/models/calorie-lens/config.json'), 'utf8'),
)
const reference = JSON.parse(readFileSync(join(__dirname, 'fixtures/calorie-lens-reference.json'), 'utf8'))

function rawOf(photo: string): RawPlateOutputs {
  const raw = reference[photo].raw
  return { grams: raw.grams, logits: raw.logits, massGap: raw.mass_gap[0], logTotals: raw.log_totals }
}

describe('readPlate', () => {
  it('da lo mismo que el script oficial: ingredientes con sus gramos y nutrientes, otros y totales', () => {
    // Ensalada (foto de ejemplo): el script oficial detecta 5 ingredientes.
    const expected = reference['example_3.png'].summary
    const plate = readPlate(rawOf('example_3.png'), config)

    expect(plate.ingredients.map((item) => item.name)).toEqual(
      expected.ingredients.map((item: { name: string }) => item.name),
    )
    plate.ingredients.forEach((item, i) => {
      expect(item.grams).toBeCloseTo(expected.ingredients[i].grams, 1)
      expect(item.confidence).toBeCloseTo(expected.ingredients[i].confidence, 3)
      for (const key of NUTRIENT_KEYS) expect(item[key]).toBeCloseTo(expected.ingredients[i][key], 1)
    })
    expect(plate.other.grams).toBeCloseTo(expected.other.grams, 1)
    expect(plate.totals.mass_g).toBeCloseTo(expected.totals.mass_g, 1)
    for (const key of NUTRIENT_KEYS) expect(plate.totals[key]).toBeCloseTo(expected.totals[key], 1)
    expect(plate.directEstimate.kcal).toBeCloseTo(expected.direct_estimate.kcal, 1)
    expect(plate.directEstimate.mass_g).toBeCloseTo(expected.direct_estimate.mass_g, 1)
  })

  it('si ningún ingrediente es seguro, todo queda en "otros" y los totales igual salen', () => {
    // Edamame (Food-101): ningún ingrediente pasa el umbral de confianza.
    const expected = reference['f101_edamame.jpg'].summary
    const plate = readPlate(rawOf('f101_edamame.jpg'), config)

    expect(plate.ingredients).toEqual([])
    expect(plate.other.grams).toBeCloseTo(expected.other.grams, 1)
    expect(plate.totals.kcal).toBeCloseTo(expected.totals.kcal, 1)
  })
})

describe('scaleToPlateWeight', () => {
  it('con el peso real del plato, escala gramos y nutrientes en la misma proporción', () => {
    const plate = readPlate(rawOf('example_3.png'), config) // 462.4 g estimados
    const factor = 500 / plate.totals.mass_g

    const weighed = scaleToPlateWeight(plate, 500)

    expect(weighed.totals.mass_g).toBeCloseTo(500, 1)
    expect(weighed.totals.kcal).toBeCloseTo(plate.totals.kcal * factor, 0)
    expect(weighed.ingredients[0].grams).toBeCloseTo(plate.ingredients[0].grams * factor, 0)
    expect(weighed.other.protein_g).toBeCloseTo(plate.other.protein_g * factor, 1)
  })
})

describe('ingredientNameEs', () => {
  it('tiene un nombre en español para cada uno de los 253 ingredientes del modelo', () => {
    const missing = config.ingredients.filter((name) => !ingredientNameEs[name])
    expect(missing).toEqual([])
  })
})
