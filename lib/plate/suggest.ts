/** CLIP compara la foto con cada alimento con esta escala (su "logit scale" aprendido es 100). */
const CLIP_SCALE = 100
/** Probabilidad mínima para proponer un alimento, y cuántos como máximo. */
const MIN_PROBABILITY = 0.05
const MAX_SUGGESTIONS = 5

export interface FoodEmbedding {
  name: string
  embedding: number[]
}

/**
 * Alimentos que probablemente están en la foto: parecido (coseno) entre el
 * vector de la foto y el de cada alimento, pasado a probabilidades. Siempre
 * propone el más parecido; los demás, si llegan al 5 %.
 */
export function suggestFoods(photo: ArrayLike<number>, foods: FoodEmbedding[]) {
  const logits = foods.map(({ embedding }) => CLIP_SCALE * embedding.reduce((sum, value, i) => sum + value * photo[i], 0))
  const max = Math.max(...logits)
  const exps = logits.map((logit) => Math.exp(logit - max))
  const total = exps.reduce((sum, value) => sum + value, 0)
  return foods
    .map((food, i) => ({ name: food.name, probability: exps[i] / total }))
    .sort((a, b) => b.probability - a.probability)
    .filter((food, i) => i === 0 || food.probability >= MIN_PROBABILITY)
    .slice(0, MAX_SUGGESTIONS)
}
