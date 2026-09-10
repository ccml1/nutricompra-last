'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ShoppingState {
  checked: Record<string, boolean>
  toggle: (itemId: string) => void
  clear: () => void
}

export const useShopping = create<ShoppingState>()(
  persist(
    (set) => ({
      checked: {},
      toggle: (itemId) =>
        set((state) => ({
          checked: { ...state.checked, [itemId]: !state.checked[itemId] },
        })),
      clear: () => set({ checked: {} }),
    }),
    { name: 'nutricompra-shopping' },
  ),
)
