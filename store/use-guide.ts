'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Guía de primeros pasos: qué secciones ya visitó la persona y si cerró la guía.
 * Vive en el navegador, como la sesión.
 */
interface GuideState {
  visited: string[]
  dismissed: boolean
  markVisited: (href: string) => void
  dismiss: () => void
  reset: () => void
}

export const useGuide = create<GuideState>()(
  persist(
    (set) => ({
      visited: [],
      dismissed: false,
      markVisited: (href) =>
        set((state) => (state.visited.includes(href) ? state : { visited: [...state.visited, href] })),
      dismiss: () => set({ dismissed: true }),
      reset: () => set({ visited: [], dismissed: false }),
    }),
    { name: 'nutricompra-guide' },
  ),
)
