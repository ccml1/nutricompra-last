import { describe, expect, it } from 'vitest'
import { MODEL_HEIGHT, MODEL_WIDTH, letterbox, toChw } from './preprocess'

describe('letterbox', () => {
  it('encaja la foto en 504 x 378 sin deformarla y la centra (como el script oficial)', () => {
    // Foto cuadrada de 128 px: se agranda a 378 x 378 y queda centrada a lo ancho.
    expect(letterbox(128, 128)).toEqual({ width: 378, height: 378, x: 63, y: 0 })
    // Foto 4:3 de un celular: ocupa todo el lienzo.
    expect(letterbox(4000, 3000)).toEqual({ width: 504, height: 378, x: 0, y: 0 })
    expect([MODEL_WIDTH, MODEL_HEIGHT]).toEqual([504, 378])
  })
})

describe('toChw', () => {
  it('pasa los píxeles RGBA a canales separados (rojo, verde, azul) entre 0 y 1', () => {
    // Dos píxeles: rojo puro y gris (51, 102, 153). El canal alfa se descarta.
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 51, 102, 153, 255])

    // Float32Array: 0.2 se guarda como 0.2000000029…, por eso se compara con tolerancia.
    const expected = [1, 0.2, 0, 0.4, 0, 0.6]
    Array.from(toChw(rgba, 2, 1)).forEach((value, i) => expect(value).toBeCloseTo(expected[i], 6))
  })
})
