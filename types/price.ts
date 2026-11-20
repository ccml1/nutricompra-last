import type { FoodCategory } from './food'

export type EstablishmentType = 'mercado' | 'bodega' | 'supermercado'

export interface Establishment {
  id: string
  name: string
  type: EstablishmentType
}

export interface EstablishmentPrice {
  establishmentId: string
  price: number
}

export interface ProductPrice {
  foodId: string
  name: string
  category: FoodCategory
  unit: string
  prices: EstablishmentPrice[]
  /** Precio más bajo entre establecimientos. */
  bestPrice: number
  bestEstablishmentId: string
  /** Precio más alto, usado para calcular el ahorro potencial. */
  highestPrice: number
}

/** Precio de un producto en una tienda real (Plaza Vea, Wong, Metro), según GET /products. */
export interface StoreOffer {
  store: string
  storeName: string
  /** Céntimos enteros: S/ 26.40 → 2640. */
  priceCents: number
  /** Fecha y hora ISO en que se consultó el precio en la tienda. */
  observedAt: string
  /** Ficha del producto en la web de la tienda. */
  url: string
  /** El más barato del producto (todos si empatan); nunca si solo lo vende una tienda. */
  isBest: boolean
  /** Precio por kg o por litro en céntimos (S/ 30.44 → 3044); null si no se sabe el tamaño. */
  unitPriceCents: number | null
  /** "kg" o "L"; null junto con `unitPriceCents`. */
  unitPriceBasis: 'kg' | 'L' | null
}

/**
 * Orden de GET /products: Relevancia (por defecto), Menor precio, Mayor precio
 * y Menor precio por kg/L.
 */
export type StoreSort = 'relevance' | 'price-asc' | 'price-desc' | 'unit-price'

/** Un producto con su precio en cada tienda que lo vende, según GET /products. */
export interface StoreProductGroup {
  groupKey: string
  name: string
  brand: string | null
  offers: StoreOffer[]
}
