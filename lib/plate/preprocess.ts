/**
 * La foto lista para CLIP, igual que su procesador oficial: el lado corto a
 * 224 px, recorte del centro de 224 x 224 y cada canal normalizado con la
 * media y la desviación con que se entrenó el modelo.
 */
export const CLIP_SIZE = 224
const MEAN = [0.48145466, 0.4578275, 0.40821073]
const STD = [0.26862954, 0.26130258, 0.27577711]

/** Tamaño y posición de la foto para que su centro quede en el cuadro de 224 x 224. */
export function clipCrop(width: number, height: number) {
  const scale = CLIP_SIZE / Math.min(width, height)
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  return { width: w, height: h, x: Math.floor((CLIP_SIZE - w) / 2), y: Math.floor((CLIP_SIZE - h) / 2) }
}

/** Píxeles RGBA a canales rojo, verde y azul por separado, normalizados para CLIP. */
export function toClipInput(rgba: Uint8ClampedArray, width: number, height: number): Float32Array {
  const size = width * height
  const chw = new Float32Array(3 * size)
  for (let p = 0; p < size; p++) {
    for (let c = 0; c < 3; c++) chw[c * size + p] = (rgba[4 * p + c] / 255 - MEAN[c]) / STD[c]
  }
  return chw
}

/** La foto como entrada del modelo: [1, 3, 224, 224]. Solo en el navegador. */
export async function imageToClipInput(image: Blob): Promise<Float32Array> {
  // `from-image` respeta la orientación con la que se tomó la foto en el celular.
  const bitmap = await createImageBitmap(image, { imageOrientation: 'from-image' })
  const canvas = new OffscreenCanvas(CLIP_SIZE, CLIP_SIZE)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('El navegador no puede preparar la foto')
  context.imageSmoothingQuality = 'high'
  const box = clipCrop(bitmap.width, bitmap.height)
  context.drawImage(bitmap, box.x, box.y, box.width, box.height)
  bitmap.close()
  return toClipInput(context.getImageData(0, 0, CLIP_SIZE, CLIP_SIZE).data, CLIP_SIZE, CLIP_SIZE)
}

/** Lado mayor de la foto que se envía al modelo de visión: suficiente para ver el plato y liviana (~150 KB). */
const UPLOAD_MAX_SIDE = 768

/** La foto achicada como JPEG en base64 (data URL), lista para enviar. Solo en el navegador. */
export async function photoToJpegDataUrl(image: Blob, maxSide = UPLOAD_MAX_SIDE): Promise<string> {
  const bitmap = await createImageBitmap(image, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('El navegador no puede preparar la foto')
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}
