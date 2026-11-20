import { describe, expect, it } from 'vitest'
import { formatUnitPrice } from './format'

// Espacios que no se cortan (U+00A0): el precio y su unidad nunca quedan en dos líneas.
const nbsp = '\u00a0'

describe('formatUnitPrice', () => {
  it('muestra el precio por kg o L como "S/ 30.44 /L"', () => {
    expect(formatUnitPrice(3044, 'L')).toBe(`S/${nbsp}30.44${nbsp}/L`)
    expect(formatUnitPrice(458, 'kg')).toBe(`S/${nbsp}4.58${nbsp}/kg`)
  })
})
