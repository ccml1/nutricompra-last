/**
 * Reconocimiento de alimentos en el navegador con CLIP (openai/clip-vit-base-patch16,
 * MIT, exportado a ONNX por Xenova en Hugging Face) y onnxruntime-web. Solo se usa
 * la parte de visión: los vectores de los alimentos TPCA ya están calculados en
 * public/models/clip-foods (scripts/build-food-embeddings.mjs). El modelo se
 * descarga una vez y queda guardado en el navegador; la foto no sale del equipo.
 */
import { CLIP_SIZE, imageToClipInput } from './preprocess'
import { suggestFoods, type FoodEmbedding } from './suggest'

/** Versión fija del repositorio en Hugging Face, para que el archivo no cambie sin aviso. */
const REVISION = '342fdf2f67aded64d138ff074745fb4a5d2bba5f'
const MODEL_URL = `https://huggingface.co/Xenova/clip-vit-base-patch16/resolve/${REVISION}/onnx/vision_model_quantized.onnx`
/** Tamaño y huella SHA-256 del archivo publicados por Hugging Face. */
export const MODEL_BYTES = 87_461_602
const MODEL_SHA256 = '44eece4fe5fe4e0359a88268a327adf758633a1aade3917690b952bef1501f96'
const EMBEDDINGS_URL = '/models/clip-foods/text-embeddings.json'
/** Archivo donde el navegador guarda el modelo (almacenamiento privado del sitio, OPFS). */
const MODEL_FILE = `clip-vit-b16-vision-${REVISION.slice(0, 7)}.onnx`

/** Avance de la descarga del modelo, de 0 a 1 (1 si ya estaba guardado). */
export type DownloadProgress = (fraction: number) => void

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * El modelo guardado de una visita anterior. Se usa OPFS y no la caché del
 * navegador, que en Chrome rechaza archivos grandes.
 */
async function readSavedModel(): Promise<ArrayBuffer | null> {
  try {
    const root = await navigator.storage.getDirectory()
    const file = await (await root.getFileHandle(MODEL_FILE)).getFile()
    // Solo se guarda después de verificarlo; un archivo a medias tendría otro tamaño.
    return file.size === MODEL_BYTES ? await file.arrayBuffer() : null
  } catch {
    return null
  }
}

/** Si no se puede guardar (sin espacio, ventana privada), se usa igual y se descarga la próxima vez. */
async function saveModel(buffer: ArrayBuffer): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory()
    const writable = await (await root.getFileHandle(MODEL_FILE, { create: true })).createWritable()
    await writable.write(buffer)
    await writable.close()
  } catch (error) {
    console.warn('No se pudo guardar el modelo en el navegador:', error)
  }
}

async function downloadModel(onProgress: DownloadProgress): Promise<ArrayBuffer> {
  const saved = await readSavedModel()
  if (saved) {
    onProgress(1)
    return saved
  }
  const response = await fetch(MODEL_URL)
  if (!response.ok || !response.body) throw new Error(`No se pudo descargar el modelo (${response.status})`)
  const total = Number(response.headers.get('content-length')) || MODEL_BYTES
  const bytes = new Uint8Array(total)
  const reader = response.body.getReader()
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (received + value.length > bytes.length) throw new Error('El modelo descargado no tiene el tamaño esperado')
    bytes.set(value, received)
    received += value.length
    onProgress(Math.min(received / total, 0.99))
  }
  const buffer = bytes.buffer.slice(0, received)
  if (received !== MODEL_BYTES || (await sha256(buffer)) !== MODEL_SHA256) {
    throw new Error('El modelo descargado está incompleto o no es el esperado')
  }
  await saveModel(buffer)
  onProgress(1)
  return buffer
}

type Ort = typeof import('onnxruntime-web/webgpu')
type Loaded = { ort: Ort; session: import('onnxruntime-web/webgpu').InferenceSession; foods: FoodEmbedding[] }

let loading: Promise<Loaded> | null = null

/** Carga el modelo y los vectores de los alimentos una sola vez por pestaña; si falla, se reintenta de cero. */
function loadModel(onProgress: DownloadProgress): Promise<Loaded> {
  loading ??= (async () => {
    const ort = await import('onnxruntime-web/webgpu')
    // Los binarios de onnxruntime (WASM) se sirven desde jsDelivr, en la misma versión instalada.
    ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.env.versions.web}/dist/`
    const [buffer, foods] = await Promise.all([
      downloadModel(onProgress),
      fetch(EMBEDDINGS_URL).then((response) => {
        if (!response.ok) throw new Error('No se pudo leer la lista de alimentos del modelo')
        return response.json().then((data: { foods: FoodEmbedding[] }) => data.foods)
      }),
    ])
    // WebGPU (tarjeta gráfica) es más rápido; si el navegador no lo tiene o falla, WASM.
    const create = (executionProviders: string[]) =>
      ort.InferenceSession.create(buffer, { executionProviders, graphOptimizationLevel: 'all' })
    let session
    try {
      session = await create('gpu' in navigator ? ['webgpu', 'wasm'] : ['wasm'])
    } catch {
      session = await create(['wasm'])
    }
    return { ort, session, foods }
  })().catch((error: unknown) => {
    loading = null
    throw error
  })
  return loading
}

/** Los alimentos TPCA que probablemente se ven en la foto, de más a menos probable. */
export async function recognizeFoods(photo: Blob, onProgress: DownloadProgress) {
  const { ort, session, foods } = await loadModel(onProgress)
  const input = await imageToClipInput(photo)
  const outputs = await session.run({
    pixel_values: new ort.Tensor('float32', input, [1, 3, CLIP_SIZE, CLIP_SIZE]),
  })
  const embedding = Array.from(outputs.image_embeds.data as Float32Array)
  const norm = Math.hypot(...embedding)
  return suggestFoods(
    embedding.map((value) => value / norm),
    foods,
  )
}
