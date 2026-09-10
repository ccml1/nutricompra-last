'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/use-auth'

/**
 * Protege las rutas de la app. Como la sesión es simulada y vive en el
 * navegador, esperamos a la hidratación antes de decidir la redirección.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const isAuthenticated = useAuth((s) => s.isAuthenticated)
  const onboardingComplete = useAuth((s) => s.onboardingComplete)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
    } else if (!onboardingComplete) {
      router.replace('/onboarding')
    }
  }, [hydrated, isAuthenticated, onboardingComplete, router])

  if (!hydrated || !isAuthenticated || !onboardingComplete) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" aria-label="Cargando" />
      </div>
    )
  }

  return <>{children}</>
}
