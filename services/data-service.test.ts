import { afterEach, describe, expect, it, vi } from 'vitest'
import { analyzePlatePhoto, ApiError, askNutritionChat, estimateWeightFromPhoto, searchStoreProducts } from './data-service'

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

/** Respuesta de fetch cuyo cuerpo llega en partes, como el texto que va escribiendo el modelo. */
function streamedResponse(parts: string[]) {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part))
      controller.close()
    },
  })
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

describe('askNutritionChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('envía la conversación y el contexto, y entrega la respuesta a medida que llega', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test')
    const fetchMock = vi.fn(async () => streamedResponse(['La quinua ', 'tiene 13.6 g ', 'de proteína.']))
    vi.stubGlobal('fetch', fetchMock)
    const messages = [{ role: 'user' as const, content: '¿Cuánta proteína tiene la quinua?' }]
    const parts: string[] = []

    const answer = await askNutritionChat(messages, { weeklyBudget: 180 }, (text) => parts.push(text))

    expect(answer).toBe('La quinua tiene 13.6 g de proteína.')
    expect(parts.join('')).toBe(answer)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context: { weeklyBudget: 180 } }),
      }),
    )
  })

  it('si el backend responde con error, falla con su mensaje', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ message: 'Hiciste muchas preguntas seguidas. Espera unos minutos.' }, { status: 429 })),
    )

    await expect(askNutritionChat([{ role: 'user', content: 'Hola' }], {}, () => undefined)).rejects.toThrow(
      'Hiciste muchas preguntas seguidas. Espera unos minutos.',
    )
  })
})

describe('analyzePlatePhoto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('envía la foto al backend y devuelve el plato con sus alimentos', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test')
    const analysis = { dish: 'Omelette', foods: [{ name: 'Huevo', grams: 120, inCatalog: true }] }
    const fetchMock = vi.fn(async () => Response.json(analysis))
    vi.stubGlobal('fetch', fetchMock)

    await expect(analyzePlatePhoto('data:image/jpeg;base64,AAAA')).resolves.toEqual(analysis)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/plate/analyze',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ image: 'data:image/jpeg;base64,AAAA' }) }),
    )
  })

  it('si el backend responde con error, falla con su código y su mensaje', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test')
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ message: 'Espera unos segundos.' }, { status: 429 })))

    const error = await analyzePlatePhoto('data:image/jpeg;base64,AAAA').catch((problem: unknown) => problem)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 429, message: 'Espera unos segundos.' })
  })
})

describe('estimateWeightFromPhoto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  const request = { image: 'data:image/jpeg;base64,AAAA', sex: 'female' as const, age: 34, heightCm: 160 }

  it('envía la foto con sexo, edad y estatura, y devuelve el peso con su rango', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test')
    const estimate = { weightKg: 61, lowKg: 56, highKg: 67 }
    const fetchMock = vi.fn(async () => Response.json(estimate))
    vi.stubGlobal('fetch', fetchMock)

    await expect(estimateWeightFromPhoto(request)).resolves.toEqual(estimate)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/body/estimate-weight',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }),
    )
  })

  it('si la foto no sirve, el ApiError trae el código y el mensaje del backend', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test')
    const message = 'Parece que hay más de una persona en la foto.'
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ reason: 'multiple_people', message }, { status: 422 })))

    await expect(estimateWeightFromPhoto(request)).rejects.toMatchObject({ status: 422, message })
  })
})
