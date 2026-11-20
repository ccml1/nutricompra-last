/**
 * Preparación de la foto para Calorie Lens, igual que `preprocess` del script
 * oficial: la foto entera (sin recortar) dentro de un lienzo de 504 x 378 con
 * fondo gris (124, 116, 104), y los píxeles en canales separados entre 0 y 1.
 */

export const MODEL_WIDTH = 504
export const MODEL_HEIGHT = 378
export const BACKGROUND = 'rgb(124, 116, 104)'

/** Dónde y de qué tamaño va la foto dentro del lienzo, sin deformarla y centrada. */
export function letterbox(width: number, height: number) {
  const scale = Math.min(MODEL_WIDTH / width, MODEL_HEIGHT / height)
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  return { width: w, height: h, x: Math.floor((MODEL_WIDTH - w) / 2), y: Math.floor((MODEL_HEIGHT - h) / 2) }
}

/** Píxeles RGBA (como los da un canvas) a canales rojo, verde y azul por separado, entre 0 y 1. */
export function toChw(rgba: Uint8ClampedArray, width: number, height: number): Float32Array {
  const size = width * height
  const chw = new Float32Array(3 * size)
  for (let p = 0; p < size; p++) {
    chw[p] = rgba[4 * p] / 255
    chw[size + p] = rgba[4 * p + 1] / 255
    chw[2 * size + p] = rgba[4 * p + 2] / 255
  }
  return chw
}

/** La foto lista para el modelo: [1, 3, 378, 504] en un Float32Array. Solo en el navegador. */
export async function imageToModelInput(image: Blob): Promise<Float32Array> {
  // `from-image` respeta la orientación con la que se tomó la foto en el celular.
  const bitmap = await createImageBitmap(image, { imageOrientation: 'from-image' })
  const canvas = new OffscreenCanvas(MODEL_WIDTH, MODEL_HEIGHT)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('El navegador no puede preparar la foto')
  context.fillStyle = BACKGROUND
  context.fillRect(0, 0, MODEL_WIDTH, MODEL_HEIGHT)
  context.imageSmoothingQuality = 'high'
  const box = letterbox(bitmap.width, bitmap.height)
  context.drawImage(bitmap, box.x, box.y, box.width, box.height)
  bitmap.close()
  const { data } = context.getImageData(0, 0, MODEL_WIDTH, MODEL_HEIGHT)
  return toChw(data, MODEL_WIDTH, MODEL_HEIGHT)
}
