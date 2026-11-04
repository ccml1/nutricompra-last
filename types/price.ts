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
}

/** Un producto con su precio en cada tienda que lo vende, según GET /products. */
export interface StoreProductGroup {
  groupKey: string
  name: string
  brand: string | null
  offers: StoreOffer[]
}
