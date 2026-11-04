'use client'

import { useEffect, useState } from 'react'
import { searchStoreProducts } from '@/services/data-service'
import type { StoreProductGroup } from '@/types'

export type StoreProductsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; products: StoreProductGroup[] }

type Settled = { status: 'error' } | { status: 'ready'; products: StoreProductGroup[] }

/** Pausa al escribir antes de buscar, para no pedir precios por cada letra. */
const TYPING_PAUSE_MS = 300

/**
 * Busca precios de tiendas para el texto dado. Mientras llega la respuesta el
 * estado es "loading"; una búsqueda vieja se cancela si el texto cambia.
 * `retry` vuelve a intentar la misma búsqueda después de un error.
 */
export function useStoreProducts(query: string): { state: StoreProductsState; retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<{ key: string; result: Settled } | null>(null)

  const text = query.trim()
  const key = `${attempt}:${text}`

  useEffect(() => {
    if (!text) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchStoreProducts(text, controller.signal)
        .then((products) => setSettled({ key, result: { status: 'ready', products } }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return
          // La pantalla solo muestra un mensaje genérico; el detalle va a la consola.
          console.error('No se pudieron cargar los precios:', error)
          setSettled({ key, result: { status: 'error' } })
        })
    }, TYPING_PAUSE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, text])

  const retry = () => setAttempt((value) => value + 1)
  if (!text) return { state: { status: 'idle' }, retry }
  if (settled?.key !== key) return { state: { status: 'loading' }, retry }
  return { state: settled.result, retry }
}
