export type DietaryPreference =
  | 'equilibrada'
  | 'vegetariana'
  | 'alta-proteina'
  | 'economica'
  | 'baja-en-grasa'

export type DietaryRestriction =
  | 'sin-gluten'
  | 'sin-lactosa'
  | 'sin-mani'
  | 'sin-mariscos'
  | 'ninguna'

export interface Household {
  id: string
  members: number
  children: number
  weeklyBudget: number
  preferences: DietaryPreference[]
  restrictions: DietaryRestriction[]
  goals: string[]
}
