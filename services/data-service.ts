import { mockFoods } from '@/data/mock-foods'
import { mockHousehold } from '@/data/mock-households'
import { mockWeekPlan } from '@/data/mock-plan'
import { mockProductPrices } from '@/data/mock-prices'
import { mockUser } from '@/data/mock-users'
import { buildShoppingList } from '@/lib/shopping'
import type {
  CatalogFood,
  Food,
  Household,
  ProductPrice,
  ShoppingList,
  StoreProductGroup,
  User,
  WeekPlan,
} from '@/types'

/**
 * Capa de acceso a datos del MVP. Todas las funciones son asíncronas para que
 * puedan reemplazarse por llamadas reales a una API o base de datos sin
 * cambiar los componentes que las consumen.
 */

const clone = <T>(value: T): T => structuredClone(value)

export async function getCurrentUser(): Promise<User> {
  return clone(mockUser)
}

export async function getHousehold(): Promise<Household> {
  return clone(mockHousehold)
}

export async function getWeekPlan(): Promise<WeekPlan> {
  return clone(mockWeekPlan)
}

export async function getFoods(): Promise<Food[]> {
  return clone(mockFoods)
}

export async function searchFoods(query: string): Promise<Food[]> {
  const q = query.trim().toLowerCase()
  if (!q) return clone(mockFoods)
  return clone(mockFoods.filter((f) => f.name.toLowerCase().includes(q)))
}

export async function getProductPrices(): Promise<ProductPrice[]> {
  return clone(mockProductPrices)
}

export async function getShoppingList(): Promise<ShoppingList> {
  return clone(buildShoppingList(mockWeekPlan))
}

/** 15 s cubre el primer arranque del backend y de Neon; si se pasa, la pantalla muestra el error. */
const API_TIMEOUT_MS = 15_000

/**
 * GET al backend NestJS. Corta a los 15 s o cuando `signal` se cancela, sin
 * `AbortSignal.any`, que no existe en navegadores algo antiguos (iOS 16).
 */
async function getFromApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    throw new Error('Falta NEXT_PUBLIC_API_URL: defínela en .env.local (ver .env.example)')
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  const cancel = () => controller.abort()
  signal?.addEventListener('abort', cancel, { once: true })
  try {
    const response = await fetch(`${apiUrl}${path}`, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`GET ${path.split('?')[0]} respondió ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}

/**
 * Catálogo de alimentos TPCA con su información nutricional, servido por el
 * backend NestJS. Es la primera función que ya no usa datos de prueba.
 */
export async function getCatalogFoods(): Promise<CatalogFood[]> {
  return getFromApi('/foods')
}

/**
 * Productos de Plaza Vea, Wong y Metro cuyo nombre contiene todas las
 * palabras buscadas, con su precio en cada tienda (máximo 20). `signal`
 * permite cancelar una búsqueda que ya no sirve porque se siguió escribiendo.
 */
export async function searchStoreProducts(
  query: string,
  signal?: AbortSignal,
): Promise<StoreProductGroup[]> {
  return getFromApi(`/products?q=${encodeURIComponent(query)}`, signal)
}
