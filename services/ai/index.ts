import {
  mockAssistantService,
  mockMealPlanService,
  mockRecommendationService,
} from './mock-ai'
import type {
  AssistantService,
  MealPlanService,
  RecommendationService,
} from './types'

/**
 * Punto único de acceso a los servicios inteligentes. Cambiar estas
 * asignaciones por implementaciones reales (AI SDK / API) migrará toda la app.
 */
export const mealPlanService: MealPlanService = mockMealPlanService
export const recommendationService: RecommendationService = mockRecommendationService
export const assistantService: AssistantService = mockAssistantService

export * from './types'
