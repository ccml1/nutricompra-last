export type RecommendationType = 'ahorro' | 'nutricion' | 'presupuesto' | 'variedad'

export interface Recommendation {
  id: string
  type: RecommendationType
  title: string
  message: string
  /** Ahorro estimado en soles, cuando aplica. */
  savings?: number
  actionLabel?: string
  actionHref?: string
}
