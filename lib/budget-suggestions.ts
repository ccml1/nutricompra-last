/**
 * Presupuestos semanales sugeridos para la comida de un hogar, a partir de la
 * canasta básica de alimentos del INEI: S/ 260 por persona al mes (2025), unos
 * S/ 60 por semana. Un niño menor de 12 come alrededor de tres cuartos de eso.
 */
const PER_ADULT = 60
const PER_CHILD = 45

const roundTo10 = (value: number) => Math.max(20, Math.round(value / 10) * 10)

export const MIN_BUDGET = 20
export const MAX_BUDGET = 2000

export function budgetSuggestions(adults: number, children: number) {
  const base = Math.max(1, adults) * PER_ADULT + Math.max(0, children) * PER_CHILD
  return [
    { key: 'ajustado', label: 'Ajustado', amount: roundTo10(base * 0.85) },
    { key: 'recomendado', label: 'Canasta básica', amount: roundTo10(base) },
    { key: 'holgado', label: 'Holgado', amount: roundTo10(base * 1.3) },
  ] as const
}
