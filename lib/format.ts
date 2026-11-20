const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formatea un monto en soles peruanos, p. ej. `S/ 12.50`. */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value).replace('PEN', 'S/').trim()
}

/**
 * Formatea el precio por kg o por litro de un producto, p. ej. `S/ 30.44 /L`.
 * La unidad va pegada con un espacio que no se corta, igual que `S/`.
 */
export function formatUnitPrice(cents: number, basis: 'kg' | 'L'): string {
  return `${formatCurrency(cents / 100)} /${basis}`
}

/** Formatea un porcentaje entero, p. ej. `73%`. */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

/** Formatea gramos o calorías con su unidad. */
export function formatGrams(value: number): string {
  return `${Math.round(value)} g`
}

export function formatCalories(value: number): string {
  return `${Math.round(value)} kcal`
}
