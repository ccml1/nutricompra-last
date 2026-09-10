import type { FoodCategory } from './food'

export interface ShoppingItem {
  id: string
  foodId: string
  name: string
  category: FoodCategory
  quantity: string
  estimatedPrice: number
  bestPrice: number
  bestEstablishment: string
}

export interface ShoppingList {
  id: string
  budget: number
  items: ShoppingItem[]
}
