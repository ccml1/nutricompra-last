'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockHousehold } from '@/data/mock-households'
import { mockUser } from '@/data/mock-users'
import type { Household, User } from '@/types'

/**
 * Sesión simulada para el MVP (sin backend). Persiste en el navegador solo
 * para mantener la comodidad de la demo. Reemplazar por autenticación real
 * (p. ej. Better Auth) mantiene esta misma superficie de estado.
 */
interface AuthState {
  isAuthenticated: boolean
  onboardingComplete: boolean
  user: User | null
  household: Household
  login: (email: string, name?: string) => void
  register: (name: string, email: string) => void
  completeOnboarding: (household: Household) => void
  updateHousehold: (household: Partial<Household>) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      onboardingComplete: false,
      user: null,
      household: mockHousehold,
      login: (email, name) =>
        set({
          isAuthenticated: true,
          user: {
            ...mockUser,
            email,
            ...(name
              ? { name, firstName: name.split(' ')[0], avatarInitials: initials(name) }
              : {}),
          },
        }),
      register: (name, email) =>
        set({
          isAuthenticated: true,
          onboardingComplete: false,
          user: {
            ...mockUser,
            name,
            firstName: name.split(' ')[0],
            email,
            avatarInitials: initials(name),
          },
        }),
      completeOnboarding: (household) =>
        set({ household, onboardingComplete: true }),
      updateHousehold: (household) =>
        set((state) => ({ household: { ...state.household, ...household } })),
      logout: () =>
        set({ isAuthenticated: false, onboardingComplete: false, user: null }),
    }),
    { name: 'nutricompra-session' },
  ),
)

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
