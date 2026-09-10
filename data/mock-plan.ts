import type { DayPlan, Meal, Weekday, WeekPlan } from '@/types'
import { mockMealsById } from './mock-meals'

const meal = (id: string): Meal => mockMealsById[id]

const dayPlan = (
  day: Weekday,
  desayuno: string,
  almuerzo: string,
  cena: string,
): DayPlan => ({
  day,
  desayuno: meal(desayuno),
  almuerzo: meal(almuerzo),
  cena: meal(cena),
})

export const mockWeekPlan: WeekPlan = {
  id: 'plan-1',
  weekLabel: 'Semana actual',
  budget: 180,
  days: [
    dayPlan('lunes', 'avena-frutas', 'arroz-pollo', 'crema-verduras'),
    dayPlan('martes', 'pan-huevo', 'lentejas-arroz', 'tortilla-verduras'),
    dayPlan('miercoles', 'yogurt-avena', 'jurel-papa', 'sopa-quinua'),
    dayPlan('jueves', 'avena-frutas', 'frijoles-arroz', 'ensalada-atun'),
    dayPlan('viernes', 'quinua-leche', 'arroz-pollo', 'tortilla-verduras'),
    dayPlan('sabado', 'pan-huevo', 'estofado-res', 'crema-verduras'),
    dayPlan('domingo', 'yogurt-avena', 'jurel-papa', 'sopa-quinua'),
  ],
}

export const weekdayLabels: Record<Weekday, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export const mealTypeLabels = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
} as const
