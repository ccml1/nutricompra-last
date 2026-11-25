import type { Household } from '@/types'

/** Un niño menor de 12 come alrededor de tres cuartos de la porción de un adulto. */
export const CHILD_PORTION = 0.75

/** Porciones que come el hogar en cada comida: adultos + niños × 0.75. */
export function householdPortions(household: Pick<Household, 'members' | 'children'>): number {
  const children = Math.max(0, Math.min(household.children, household.members))
  const adults = Math.max(1, household.members - children)
  return adults + children * CHILD_PORTION
}

/** Lo que cuesta una comida para todo el hogar, a partir de su costo por persona. */
export const familyCost = (perPerson: number, portions: number) => Math.round(perPerson * portions * 10) / 10
