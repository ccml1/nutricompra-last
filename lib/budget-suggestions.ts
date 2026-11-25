/**
 * Presupuestos semanales sugeridos para la comida de un hogar en Lima, según
 * cuántos adultos y niños son. Son referencias para empezar, no un cálculo exacto:
 * un adulto come por unos S/ 50 a la semana con un menú casero, un niño por unos S/ 35.
 */
const PER_ADULT = 50
const PER_CHILD = 35

const roundTo10 = (value: number) => Math.max(20, Math.round(value / 10) * 10)

export const MIN_BUDGET = 20
export const MAX_BUDGET = 2000

export function budgetSuggestions(members: number, children: number) {
  const kids = Math.min(children, members)
  const base = (members - kids) * PER_ADULT + kids * PER_CHILD
  return [
    { key: 'ajustado', label: 'Ajustado', amount: roundTo10(base * 0.8) },
    { key: 'recomendado', label: 'Recomendado', amount: roundTo10(base) },
    { key: 'holgado', label: 'Holgado', amount: roundTo10(base * 1.3) },
  ] as const
}
