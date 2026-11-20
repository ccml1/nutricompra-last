import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchStoreProducts } from './data-service'

describe('searchStoreProducts', () => {
  const originalAny = AbortSignal.any

  afterEach(() => {
    Object.defineProperty(AbortSignal, 'any', { value: originalAny, configurable: true, writable: true })
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('funciona en navegadores sin AbortSignal.any (p. ej. Safari de iOS 16)', async () => {
    Object.defineProperty(AbortSignal, 'any', { value: undefined, configurable: true, writable: true })
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test')
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => [] }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchStoreProducts('leche gloria', new AbortController().signal)).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/products?q=leche%20gloria',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('pide al backend el orden elegido (Relevancia es el orden por defecto y no se envía)', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test')
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => [] }))
    vi.stubGlobal('fetch', fetchMock)

    await searchStoreProducts('aceite', undefined, 'unit-price')
    await searchStoreProducts('aceite', undefined, 'relevance')

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://api.test/products?q=aceite&sort=unit-price', expect.anything())
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://api.test/products?q=aceite', expect.anything())
  })
})
