'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/use-auth'

/** true cuando la sesión guardada en el navegador ya se cargó. */
function useAuthHydrated() {
  // En el servidor no hay sesión guardada (ni `persist`): se decide recién en el navegador.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    if (useAuth.persist.hasHydrated()) setHydrated(true)
    return useAuth.persist.onFinishHydration(() => setHydrated(true))
  }, [])
  return hydrated
}

/**
 * Protege las páginas de la app. Vive en el layout compartido, así que solo
 * espera la sesión al entrar: navegar entre secciones ya no muestra la pantalla de carga.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const isAuthenticated = useAuth((s) => s.isAuthenticated)
  const onboardingComplete = useAuth((s) => s.onboardingComplete)

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) router.replace('/login')
    else if (!onboardingComplete) router.replace('/onboarding')
  }, [hydrated, isAuthenticated, onboardingComplete, router])

  if (!hydrated || !isAuthenticated || !onboardingComplete) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary motion-reduce:animate-none" aria-label="Cargando" />
      </div>
    )
  }

  return <>{children}</>
}
