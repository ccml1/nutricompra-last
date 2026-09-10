import type { Meal } from '@/types'

/**
 * Comidas base del MVP. Los valores nutricionales son por porción individual
 * y los costos están en soles (S/) de forma aproximada.
 */
export const mockMeals: Meal[] = [
  // Desayunos
  {
    id: 'avena-frutas',
    name: 'Avena con plátano y leche',
    type: 'desayuno',
    description: 'Avena cocida en leche con rodajas de plátano. Energía para empezar el día.',
    ingredients: [
      { foodId: 'avena', name: 'Avena', quantity: '60 g', cost: 0.4 },
      { foodId: 'leche', name: 'Leche', quantity: '200 ml', cost: 0.9 },
      { foodId: 'platano', name: 'Plátano', quantity: '1 unidad', cost: 0.4 },
    ],
    estimatedCost: 1.7,
    nutrition: { calories: 320, protein: 12, carbs: 55, fats: 6, fiber: 7 },
    healthScore: 'alto',
  },
  {
    id: 'pan-huevo',
    name: 'Pan integral con huevo',
    type: 'desayuno',
    description: 'Pan integral con huevo revuelto y una naranja. Proteína y fibra.',
    ingredients: [
      { foodId: 'pan-integral', name: 'Pan integral', quantity: '2 unidades', cost: 1.0 },
      { foodId: 'huevos', name: 'Huevo', quantity: '2 unidades', cost: 1.0 },
      { foodId: 'naranja', name: 'Naranja', quantity: '1 unidad', cost: 0.4 },
    ],
    estimatedCost: 2.4,
    nutrition: { calories: 360, protein: 18, carbs: 40, fats: 12, fiber: 6 },
    healthScore: 'alto',
  },
  {
    id: 'yogurt-avena',
    name: 'Yogurt con avena y manzana',
    type: 'desayuno',
    description: 'Yogurt natural con avena y trozos de manzana. Ligero y nutritivo.',
    ingredients: [
      { foodId: 'yogurt', name: 'Yogurt', quantity: '200 ml', cost: 1.4 },
      { foodId: 'avena', name: 'Avena', quantity: '40 g', cost: 0.3 },
      { foodId: 'manzana', name: 'Manzana', quantity: '1 unidad', cost: 0.9 },
    ],
    estimatedCost: 2.6,
    nutrition: { calories: 290, protein: 11, carbs: 48, fats: 5, fiber: 6 },
    healthScore: 'alto',
  },
  {
    id: 'quinua-leche',
    name: 'Quinua con leche y papaya',
    type: 'desayuno',
    description: 'Mazamorra de quinua con leche acompañada de papaya fresca.',
    ingredients: [
      { foodId: 'quinua', name: 'Quinua', quantity: '50 g', cost: 0.7 },
      { foodId: 'leche', name: 'Leche', quantity: '200 ml', cost: 0.9 },
      { foodId: 'papaya', name: 'Papaya', quantity: '150 g', cost: 0.6 },
    ],
    estimatedCost: 2.2,
    nutrition: { calories: 300, protein: 12, carbs: 50, fats: 6, fiber: 6 },
    healthScore: 'alto',
  },

  // Almuerzos
  {
    id: 'arroz-pollo',
    name: 'Arroz con pollo y ensalada',
    type: 'almuerzo',
    description: 'Clásico arroz con presa de pollo y ensalada fresca de tomate y cebolla.',
    ingredients: [
      { foodId: 'arroz', name: 'Arroz', quantity: '120 g', cost: 0.5 },
      { foodId: 'pollo', name: 'Pollo', quantity: '150 g', cost: 1.7 },
      { foodId: 'tomate', name: 'Tomate', quantity: '80 g', cost: 0.3 },
      { foodId: 'cebolla', name: 'Cebolla', quantity: '50 g', cost: 0.1 },
    ],
    estimatedCost: 2.6,
    nutrition: { calories: 520, protein: 34, carbs: 62, fats: 12, fiber: 4 },
    healthScore: 'alto',
  },
  {
    id: 'lentejas-arroz',
    name: 'Lentejas con arroz',
    type: 'almuerzo',
    description: 'Guiso de lentejas con zanahoria acompañado de arroz. Económico y proteico.',
    ingredients: [
      { foodId: 'lentejas', name: 'Lentejas', quantity: '100 g', cost: 0.7 },
      { foodId: 'arroz', name: 'Arroz', quantity: '120 g', cost: 0.5 },
      { foodId: 'zanahoria', name: 'Zanahoria', quantity: '60 g', cost: 0.2 },
    ],
    estimatedCost: 1.4,
    nutrition: { calories: 470, protein: 19, carbs: 82, fats: 4, fiber: 12 },
    healthScore: 'alto',
  },
  {
    id: 'jurel-papa',
    name: 'Jurel sudado con papa',
    type: 'almuerzo',
    description: 'Jurel guisado con tomate y cebolla, servido con papa sancochada.',
    ingredients: [
      { foodId: 'jurel', name: 'Jurel', quantity: '160 g', cost: 1.5 },
      { foodId: 'papa', name: 'Papa', quantity: '200 g', cost: 0.4 },
      { foodId: 'tomate', name: 'Tomate', quantity: '80 g', cost: 0.3 },
    ],
    estimatedCost: 2.2,
    nutrition: { calories: 430, protein: 38, carbs: 40, fats: 10, fiber: 5 },
    healthScore: 'alto',
  },
  {
    id: 'frijoles-arroz',
    name: 'Frijoles con arroz',
    type: 'almuerzo',
    description: 'Frijoles guisados con arroz blanco y ensalada. Un plato tradicional y rendidor.',
    ingredients: [
      { foodId: 'frijoles', name: 'Frijoles', quantity: '100 g', cost: 0.8 },
      { foodId: 'arroz', name: 'Arroz', quantity: '120 g', cost: 0.5 },
      { foodId: 'cebolla', name: 'Cebolla', quantity: '50 g', cost: 0.1 },
    ],
    estimatedCost: 1.4,
    nutrition: { calories: 480, protein: 18, carbs: 88, fats: 4, fiber: 11 },
    healthScore: 'medio',
  },
  {
    id: 'estofado-res',
    name: 'Estofado de res con papa',
    type: 'almuerzo',
    description: 'Estofado de res con papa y zanahoria en salsa de tomate. Rico en hierro.',
    ingredients: [
      { foodId: 'carne-res', name: 'Carne de res', quantity: '120 g', cost: 2.6 },
      { foodId: 'papa', name: 'Papa', quantity: '150 g', cost: 0.3 },
      { foodId: 'zanahoria', name: 'Zanahoria', quantity: '60 g', cost: 0.2 },
      { foodId: 'arroz', name: 'Arroz', quantity: '100 g', cost: 0.4 },
    ],
    estimatedCost: 3.5,
    nutrition: { calories: 560, protein: 33, carbs: 58, fats: 18, fiber: 5 },
    healthScore: 'medio',
  },

  // Cenas
  {
    id: 'crema-verduras',
    name: 'Crema de verduras con pan',
    type: 'cena',
    description: 'Crema de zanahoria y papa con un toque de leche, acompañada de pan integral.',
    ingredients: [
      { foodId: 'zanahoria', name: 'Zanahoria', quantity: '100 g', cost: 0.3 },
      { foodId: 'papa', name: 'Papa', quantity: '100 g', cost: 0.2 },
      { foodId: 'leche', name: 'Leche', quantity: '100 ml', cost: 0.4 },
      { foodId: 'pan-integral', name: 'Pan integral', quantity: '1 unidad', cost: 0.5 },
    ],
    estimatedCost: 1.4,
    nutrition: { calories: 260, protein: 8, carbs: 44, fats: 6, fiber: 6 },
    healthScore: 'alto',
  },
  {
    id: 'tortilla-verduras',
    name: 'Tortilla de verduras',
    type: 'cena',
    description: 'Tortilla de huevo con espinaca y tomate. Ligera y rápida de preparar.',
    ingredients: [
      { foodId: 'huevos', name: 'Huevo', quantity: '2 unidades', cost: 1.0 },
      { foodId: 'espinaca', name: 'Espinaca', quantity: '60 g', cost: 0.4 },
      { foodId: 'tomate', name: 'Tomate', quantity: '60 g', cost: 0.2 },
    ],
    estimatedCost: 1.6,
    nutrition: { calories: 240, protein: 16, carbs: 8, fats: 15, fiber: 3 },
    healthScore: 'alto',
  },
  {
    id: 'sopa-quinua',
    name: 'Sopa de quinua con pollo',
    type: 'cena',
    description: 'Sopa nutritiva de quinua con trozos de pollo y verduras.',
    ingredients: [
      { foodId: 'quinua', name: 'Quinua', quantity: '50 g', cost: 0.7 },
      { foodId: 'pollo', name: 'Pollo', quantity: '80 g', cost: 0.9 },
      { foodId: 'zanahoria', name: 'Zanahoria', quantity: '50 g', cost: 0.2 },
      { foodId: 'papa', name: 'Papa', quantity: '80 g', cost: 0.2 },
    ],
    estimatedCost: 2.0,
    nutrition: { calories: 330, protein: 22, carbs: 40, fats: 8, fiber: 5 },
    healthScore: 'alto',
  },
  {
    id: 'ensalada-atun',
    name: 'Ensalada de atún con papa',
    type: 'cena',
    description: 'Ensalada fresca de atún, papa sancochada, tomate y cebolla.',
    ingredients: [
      { foodId: 'atun', name: 'Atún enlatado', quantity: '1 lata', cost: 2.3 },
      { foodId: 'papa', name: 'Papa', quantity: '120 g', cost: 0.3 },
      { foodId: 'tomate', name: 'Tomate', quantity: '80 g', cost: 0.3 },
      { foodId: 'cebolla', name: 'Cebolla', quantity: '40 g', cost: 0.1 },
    ],
    estimatedCost: 3.0,
    nutrition: { calories: 300, protein: 26, carbs: 30, fats: 8, fiber: 4 },
    healthScore: 'alto',
  },
]

export const mockMealsById: Record<string, Meal> = Object.fromEntries(
  mockMeals.map((m) => [m.id, m]),
)
