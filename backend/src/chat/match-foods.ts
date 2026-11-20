import { normalizeSearchText } from '../prices/search-text';

/** Alimentos del catálogo que se pasan al modelo como máximo por pregunta. */
const MAX_FOODS = 5;

/** Palabras sin tildes ni signos ("¿QUINUA?" → "quinua"). */
const wordsOf = (text: string) => normalizeSearchText(text).split(/[^a-z0-9]+/).filter(Boolean);

/**
 * Alimentos del catálogo que nombra la pregunta: los que tienen su primera
 * palabra (de 3 letras o más) en ella. Primero los que coinciden en más
 * palabras ("arroz integral" antes que "arroz blanco"); a igualdad, el nombre
 * más corto, que suele ser el alimento base.
 */
export function matchFoods<T extends { name: string }>(question: string, foods: T[]): T[] {
  const asked = new Set(wordsOf(question));
  return foods
    .map((food) => {
      const words = wordsOf(food.name);
      const matched = words.filter((word) => asked.has(word)).length;
      return { food, words, matched };
    })
    .filter(({ words }) => words[0]?.length >= 3 && asked.has(words[0]))
    .sort((a, b) => b.matched - a.matched || a.food.name.length - b.food.name.length)
    .slice(0, MAX_FOODS)
    .map(({ food }) => food);
}
