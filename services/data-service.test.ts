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
})
