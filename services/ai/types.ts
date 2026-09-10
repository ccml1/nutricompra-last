import type { Household, Meal, Recommendation, WeekPlan } from '@/types'

/**
 * Contratos para los servicios inteligentes de NutriCompra. En el MVP estas
 * interfaces se implementan con datos y reglas locales (ver `mock-ai.ts`).
 * Están diseñadas para ser reemplazadas por una integración real de IA
 * (por ejemplo, el AI SDK de Vercel) sin cambiar el resto de la aplicación.
 */

export interface MealPlanService {
  /** Genera un plan semanal según el hogar y su presupuesto. */
  generateWeekPlan(household: Household): Promise<WeekPlan>
  /** Sugiere un reemplazo para una comida específica. */
  suggestAlternative(meal: Meal, household: Household): Promise<Meal>
}

export interface RecommendationService {
  /** Devuelve recomendaciones de ahorro y nutrición para el plan actual. */
  getRecommendations(plan: WeekPlan, household: Household): Promise<Recommendation[]>
}

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantService {
  /** Responde preguntas sobre alimentación, presupuesto y menús. */
  ask(messages: AssistantMessage[], household: Household): Promise<string>
}
