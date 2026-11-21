import { describe, expect, it } from 'vitest'
import { CLIP_SIZE, clipCrop, toClipInput } from './preprocess'

describe('clipCrop', () => {
  it('lleva el lado corto a 224 px y recorta el centro, como el procesador de CLIP', () => {
    // Foto 4:3 de celular: 299 x 224 y se recorta el centro (sobran 75 px de ancho).
    expect(clipCrop(640, 480)).toEqual({ width: 299, height: 224, x: -38, y: 0 })
    // Foto vertical: 224 x 299, se recorta arriba y abajo.
    expect(clipCrop(480, 640)).toEqual({ width: 224, height: 299, x: 0, y: -38 })
    expect(CLIP_SIZE).toBe(224)
  })
})

describe('toClipInput', () => {
  it('pasa los píxeles a canales rojo, verde y azul normalizados con la media y desviación de CLIP', () => {
    // Un píxel gris medio (128, 128, 128): (128/255 − media) / desviación por canal.
    const input = toClipInput(new Uint8ClampedArray([128, 128, 128, 255]), 1, 1)
    const expected = [(128 / 255 - 0.48145466) / 0.26862954, (128 / 255 - 0.4578275) / 0.26130258, (128 / 255 - 0.40821073) / 0.27577711]

    Array.from(input).forEach((value, i) => expect(value).toBeCloseTo(expected[i], 5))
  })
})
