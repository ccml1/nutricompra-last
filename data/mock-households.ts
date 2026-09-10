import type {
  DietaryPreference,
  DietaryRestriction,
  Household,
} from '@/types'

export const mockHousehold: Household = {
  id: 'household-1',
  members: 4,
  children: 2,
  weeklyBudget: 180,
  preferences: ['equilibrada', 'economica'],
  restrictions: ['ninguna'],
  goals: [
    'Mantener el gasto dentro del presupuesto semanal',
    'Incluir más verduras y frutas en las comidas',
    'Asegurar suficiente proteína para los niños',
  ],
}

export const dietaryPreferenceLabels: Record<DietaryPreference, string> = {
  equilibrada: 'Alimentación equilibrada',
  vegetariana: 'Vegetariana',
  'alta-proteina': 'Alta en proteína',
  economica: 'Económica',
  'baja-en-grasa': 'Baja en grasa',
}

export const dietaryRestrictionLabels: Record<DietaryRestriction, string> = {
  'sin-gluten': 'Sin gluten',
  'sin-lactosa': 'Sin lactosa',
  'sin-mani': 'Sin maní',
  'sin-mariscos': 'Sin mariscos',
  ninguna: 'Sin restricciones',
}
