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
  equilibrada: 'Equilibrada',
  economica: 'Económica',
  'alta-proteina': 'Alta en proteína',
  'mas-verduras': 'Más frutas y verduras',
  'mas-pescado': 'Más pescado',
  'baja-en-grasa': 'Baja en grasa',
  'baja-en-azucar': 'Baja en azúcar',
  rapida: 'Rápida de preparar',
  vegetariana: 'Vegetariana',
  vegana: 'Vegana',
}

export const dietaryRestrictionLabels: Record<DietaryRestriction, string> = {
  ninguna: 'Sin restricciones',
  'sin-gluten': 'Sin gluten (celiaquía)',
  'sin-lactosa': 'Sin lactosa',
  'sin-mani': 'Sin maní',
  'sin-mariscos': 'Sin mariscos',
  'sin-huevo': 'Sin huevo',
  'sin-cerdo': 'Sin cerdo',
  'poca-sal': 'Poca sal (presión alta)',
  'sin-azucar': 'Sin azúcar añadida (diabetes)',
}
