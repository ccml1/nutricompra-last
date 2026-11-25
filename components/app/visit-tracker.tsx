'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { navItems } from '@/lib/nav'
import { useGuide } from '@/store/use-guide'

/** Marca la sección actual como visitada para la guía de primeros pasos del inicio. */
export function VisitTracker() {
  const pathname = usePathname()
  const markVisited = useGuide((s) => s.markVisited)

  useEffect(() => {
    const section = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    if (section) markVisited(section.href)
  }, [pathname, markVisited])

  return null
}
