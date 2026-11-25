export type DietaryPreference =
  | 'equilibrada'
  | 'economica'
  | 'alta-proteina'
  | 'mas-verduras'
  | 'mas-pescado'
  | 'baja-en-grasa'
  | 'baja-en-azucar'
  | 'rapida'
  | 'vegetariana'
  | 'vegana'

export type DietaryRestriction =
  | 'sin-gluten'
  | 'sin-lactosa'
  | 'sin-mani'
  | 'sin-mariscos'
  | 'sin-huevo'
  | 'sin-cerdo'
  | 'poca-sal'
  | 'sin-azucar'
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
