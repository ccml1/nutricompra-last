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
