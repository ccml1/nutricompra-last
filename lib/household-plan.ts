import { mockFoods } from '@/data/mock-foods'
import { mockMeals, mockMealsById } from '@/data/mock-meals'
import { budgetSuggestions } from '@/lib/budget-suggestions'
import { householdPortions } from '@/lib/portions'
import type { DayPlan, Household, Lunchbox, Meal, MealIngredient, MealType, WeekPlan, Weekday } from '@/types'

const MEAT = ['pollo', 'jurel', 'carne-res', 'atun']
const DAIRY = ['leche', 'yogurt', 'queso-fresco', 'lecheja']
const ANIMAL = [...MEAT, ...DAIRY, 'huevos']
const GLUTEN = ['pan-integral', 'pan-frances', 'fideos', 'avena']
const FISH = ['jurel', 'atun']

/** Alimentos que el hogar no come, según sus restricciones y si es vegetariano o vegano. */
export function excludedFoods(household: Pick<Household, 'preferences' | 'restrictions'>): Set<string> {
  const out = new Set<string>()
  const add = (ids: string[]) => ids.forEach((id) => out.add(id))
  if (household.preferences.includes('vegana')) add(ANIMAL)
  if (household.preferences.includes('vegetariana')) add(MEAT)
  for (const restriction of household.restrictions) {
    if (restriction === 'sin-lactosa') add(DAIRY)
    if (restriction === 'sin-huevo') add(['huevos'])
    if (restriction === 'sin-gluten') add(GLUTEN)
    if (restriction === 'sin-azucar') add(['azucar'])
    // sin-mariscos, sin-cerdo y sin-mani: ninguna comida del catálogo los usa.
  }
  return out
}

const allowed = (meal: Meal, excluded: Set<string>) => meal.ingredients.every((ing) => !excluded.has(ing.foodId))

/**
 * Puntaje de una comida (menor es mejor): en modo económico pesa el costo; las
 * preferencias del hogar acercan las comidas que le gustan.
 */
function score(meal: Meal, household: Pick<Household, 'preferences'>, economy: boolean) {
  const prefs = household.preferences
  const foods = new Set(meal.ingredients.map((ing) => ing.foodId))
  let value = meal.estimatedCost * (economy ? 1 : 0.3)
  if (prefs.includes('mas-pescado') && FISH.some((id) => foods.has(id))) value -= 0.8
  if (prefs.includes('alta-proteina')) value -= meal.nutrition.protein / 40
  if (prefs.includes('mas-verduras')) value -= meal.nutrition.fiber / 10
  if (prefs.includes('baja-en-grasa')) value += meal.nutrition.fats / 20
  if (prefs.includes('baja-en-azucar') && foods.has('azucar')) value += 0.3
  return value
}

/** Preferencias que piden cambiar el menú base (equilibrada y económica no lo cambian por sí solas). */
const SHAPING = ['mas-pescado', 'alta-proteina', 'mas-verduras', 'baja-en-grasa', 'baja-en-azucar']

const foodsById = Object.fromEntries(mockFoods.map((food) => [food.id, food]))
const ingredient = (foodId: string, quantity: number, label: string): MealIngredient => ({
  foodId,
  name: foodsById[foodId]?.name ?? foodId,
  quantity: label,
  cost: Math.round(quantity * (foodsById[foodId]?.referencePrice ?? 0) * 100) / 100,
})

/**
 * Despensa básica de la semana por porción: lo que toda cocina peruana usa
 * aunque no figure en una receta (aceite, sal, azúcar, ajo, limón).
 */
export function pantryStaples(household: Pick<Household, 'restrictions' | 'preferences'>, portions: number): MealIngredient[] {
  const lowSalt = household.restrictions.includes('poca-sal')
  const noSugar = household.restrictions.includes('sin-azucar')
  const lessSugar = household.preferences.includes('baja-en-azucar')
  const staples: [string, number][] = [
    ['aceite', 0.12],
    ['sal', lowSalt ? 0.015 : 0.03],
    ['azucar', noSugar ? 0 : lessSugar ? 0.07 : 0.15],
    ['ajo', 0.02],
    ['limon', 0.12],
  ]
  return staples
    .filter(([, perPortion]) => perPortion > 0)
    .map(([foodId, perPortion]) => {
      const quantity = perPortion * portions
      return ingredient(foodId, quantity, `${quantity.toFixed(2)} ${foodsById[foodId]?.unit ?? ''}`)
    })
}

/** Loncheras escolares económicas, por niño. */
export const lunchboxes: Lunchbox[] = [
  { id: 'pan-huevo-platano', name: 'Pan con huevo y plátano', ingredients: [ingredient('pan-frances', 1, '1 pan'), ingredient('huevos', 0.0625, '1 huevo'), ingredient('platano', 0.15, '1 plátano')], cost: 0 },
  { id: 'pan-queso-naranja', name: 'Pan con queso fresco y naranja', ingredients: [ingredient('pan-frances', 1, '1 pan'), ingredient('queso-fresco', 0.03, '30 g de queso'), ingredient('naranja', 0.2, '1 naranja')], cost: 0 },
  { id: 'camote-huevo-manzana', name: 'Camote sancochado, huevo duro y manzana', ingredients: [ingredient('camote', 0.12, '1 camote chico'), ingredient('huevos', 0.0625, '1 huevo'), ingredient('manzana', 0.15, '1 manzana')], cost: 0 },
  { id: 'avena-platano', name: 'Avena en termo y plátano', ingredients: [ingredient('avena', 0.04, '40 g de avena'), ingredient('leche', 0.2, '1 vaso de leche'), ingredient('platano', 0.15, '1 plátano')], cost: 0 },
  { id: 'papa-queso-papaya', name: 'Papa sancochada con queso y papaya', ingredients: [ingredient('papa', 0.15, '1 papa'), ingredient('queso-fresco', 0.03, '30 g de queso'), ingredient('papaya', 0.2, '1 tajada de papaya')], cost: 0 },
].map((box) => ({ ...box, cost: Math.round(box.ingredients.reduce((sum, ing) => sum + ing.cost, 0) * 100) / 100 }))

const SCHOOL_DAYS: Weekday[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'cena']

/**
 * El plan de la semana a la medida del hogar: respeta sus restricciones, se
 * acerca a sus preferencias, se vuelve más económico si el presupuesto no
 * alcanza, y suma la despensa básica y las loncheras de los niños.
 * Las comidas que la persona cambió a mano (overrides) se respetan siempre.
 */
export function adaptPlan(base: WeekPlan, household: Household, overrides: Record<string, string> = {}): WeekPlan {
  const portions = householdPortions(household)
  const excluded = excludedFoods(household)
  const kids = Math.max(0, Math.min(household.children, household.members))
  const adults = Math.max(1, household.members - kids)
  const pantry = pantryStaples(household, portions)
  const pantryCost = pantry.reduce((sum, ing) => sum + ing.cost, 0)

  const schoolBoxes = kids > 0 ? lunchboxes.filter((box) => box.ingredients.every((ing) => !excluded.has(ing.foodId))) : []
  const boxPlan = schoolBoxes.length
    ? SCHOOL_DAYS.map((day, index) => ({ day, lunchbox: schoolBoxes[index % schoolBoxes.length] }))
    : []
  const boxCost = boxPlan.reduce((sum, { lunchbox }) => sum + lunchbox.cost * kids, 0)

  const reshape = household.preferences.some((pref) => SHAPING.includes(pref))
  const options = (type: MealType) => mockMeals.filter((meal) => meal.type === type && allowed(meal, excluded))
  const isOverride = (day: Weekday, type: MealType) => Boolean(mockMealsById[overrides[`${day}-${type}`] ?? ''])

  // 1. Restricciones y preferencias: lo que el hogar no come se cambia; las preferencias reordenan el menú.
  const days: DayPlan[] = base.days.map((day, dayIndex) => {
    const next = { ...day }
    MEAL_TYPES.forEach((type, typeIndex) => {
      const chosen = overrides[`${day.day}-${type}`]
      if (chosen && mockMealsById[chosen]) {
        next[type] = mockMealsById[chosen]
        return
      }
      if (!reshape && allowed(day[type], excluded)) return
      const ranked = options(type).sort((a, b) => score(a, household, false) - score(b, household, false))
      if (!ranked.length) return
      // Se rota entre las 3 mejores para que la semana no repita lo mismo todos los días.
      next[type] = ranked[(dayIndex + typeIndex) % Math.min(3, ranked.length)]
    })
    return next
  })

  // 2. Presupuesto: mientras no alcance, se cambia la comida más cara por una más barata
  //    (sin repetir un plato más de 3 veces), así se mantiene lo más parecido al menú equilibrado.
  const total = () =>
    days.reduce((sum, day) => sum + MEAL_TYPES.reduce((s, type) => s + day[type].estimatedCost, 0), 0) * portions + pantryCost + boxCost
  const uses = (id: string) => days.reduce((count, day) => count + MEAL_TYPES.filter((type) => day[type].id === id).length, 0)
  let economy = false
  for (let step = 0; step < 21 && total() > household.weeklyBudget; step++) {
    let best: { day: DayPlan; type: MealType; meal: Meal; saving: number } | null = null
    for (const day of days) {
      for (const type of MEAL_TYPES) {
        if (isOverride(day.day, type)) continue
        const current = day[type]
        const cheaper = options(type)
          .filter((meal) => meal.estimatedCost < current.estimatedCost && uses(meal.id) < 3)
          .sort((a, b) => score(a, household, true) - score(b, household, true))[0]
        const saving = cheaper ? current.estimatedCost - cheaper.estimatedCost : 0
        if (cheaper && (!best || saving > best.saving)) best = { day, type, meal: cheaper, saving }
      }
    }
    if (!best) break
    best.day[best.type] = best.meal
    economy = true
  }
  // Un presupuesto por debajo de la canasta básica también cuenta como ajustado.
  economy ||= household.weeklyBudget < budgetSuggestions(adults, kids)[1].amount

  return {
    ...base,
    budget: household.weeklyBudget,
    days,
    portions,
    economy,
    extras: [
      ...pantry,
      ...boxPlan.flatMap(({ lunchbox }) => lunchbox.ingredients.map((ing) => ({ ...ing, cost: ing.cost * kids }))),
    ],
    lunchboxes: boxPlan,
    lunchboxChildren: kids,
  }
}
