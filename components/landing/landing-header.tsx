'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/use-auth'

export function LandingHeader() {
  // La sesión vive en el navegador: hasta cargarla se muestran los botones de entrada.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  const signedIn = useAuth((s) => s.isAuthenticated && s.onboardingComplete)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="NutriCompra, ir al inicio" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>
        <nav aria-label="Secciones de la página" className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Funciones
          </a>
          <a href="#como-funciona" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Cómo funciona
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {ready && signedIn ? (
            <Link href="/dashboard" className={cn(buttonVariants(), 'group h-9 px-4')}>
              Ir a mi semana
              <ArrowRight data-icon="inline-end" className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }), 'h-9 px-3')}>
                Iniciar sesión
              </Link>
              <Link href="/register" className={cn(buttonVariants(), 'h-9 px-4')}>
                Empezar gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
