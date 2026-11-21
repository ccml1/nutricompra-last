/** Un mensaje del chat nutricional. */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Lo que el asistente sabe del hogar: su menú, su lista de compras y su presupuesto (POST /chat). */
export interface ChatContext {
  weeklyBudget?: number
  menu?: {
    day: string
    meals: { type: string; name: string; kcal: number }[]
    kcal: number
    proteinG: number
    carbsG: number
    fatG: number
  }[]
  shoppingList?: { name: string; quantity: string }[]
  shoppingTotal?: number
}
