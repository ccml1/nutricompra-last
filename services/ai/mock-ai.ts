import { mockMeals } from '@/data/mock-meals'
import { mockWeekPlan } from '@/data/mock-plan'
import { generateRecommendations } from '@/lib/recommendations'
import type { Household, Meal, Recommendation, WeekPlan } from '@/types'
import type {
  AssistantMessage,
  AssistantService,
  MealPlanService,
  RecommendationService,
} from './types'

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockMealPlanService: MealPlanService = {
  async generateWeekPlan(_household: Household): Promise<WeekPlan> {
    await delay()
    return mockWeekPlan
  },
  async suggestAlternative(meal: Meal, _household: Household): Promise<Meal> {
    await delay()
    const alternatives = mockMeals.filter((m) => m.type === meal.type && m.id !== meal.id)
    return alternatives[Math.floor(Math.random() * alternatives.length)] ?? meal
  },
}

export const mockRecommendationService: RecommendationService = {
  async getRecommendations(
    plan: WeekPlan,
    _household: Household,
  ): Promise<Recommendation[]> {
    await delay(250)
    return generateRecommendations(plan)
  },
}

/**
 * Asistente basado en reglas simples que responde con mensajes predefinidos.
 * Reemplazar por una llamada a un modelo (server-side) en producción.
 */
export const mockAssistantService: AssistantService = {
  async ask(messages: AssistantMessage[], household: Household): Promise<string> {
    await delay(600)
    const last = messages[messages.length - 1]?.content.toLowerCase() ?? ''

    if (last.includes('ahorr') || last.includes('barat') || last.includes('precio')) {
      return 'Para ahorrar, compra frutas y verduras en el mercado y aprovecha los productos de temporada. Las legumbres como lentejas y frijoles rinden mucho y son económicas.'
    }
    if (last.includes('proteina') || last.includes('proteína')) {
      return 'Buenas fuentes de proteína económica: huevos, pollo, atún enlatado y legumbres. Combina arroz con lentejas para una proteína más completa.'
    }
    if (last.includes('niñ') || last.includes('hijo')) {
      return `Con ${household.children} niño(s) en casa, prioriza el desayuno con leche, avena y fruta, y asegura proteína en el almuerzo para apoyar su crecimiento.`
    }
    return 'Puedo ayudarte a planificar menús, ajustar tu presupuesto y comparar precios. Pregúntame, por ejemplo, cómo ahorrar esta semana o qué preparar con lo que ya tienes.'
  },
}
