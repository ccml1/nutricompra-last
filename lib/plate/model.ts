/**
 * Calorie Lens en el navegador (onnxruntime-web): descarga el modelo de
 * Hugging Face una sola vez, lo guarda en la caché del navegador y estima los
 * ingredientes y nutrientes de la foto de un plato. La foto no sale del equipo.
 *
 * Modelo: shalev396/calorie-lens (MIT), exportado a ONNX en
 * addisonbk/calorie-lens-onnx. Licencias en public/models/calorie-lens/.
 */
import { imageToModelInput, MODEL_HEIGHT, MODEL_WIDTH } from './preprocess'
import { readPlate, type PlateConfig, type PlateReadout } from './readout'

/** Versión fija del repositorio en Hugging Face, para que el archivo no cambie sin aviso. */
const REVISION = 'c8cbd0add09d605b028337f46c185436f2a80521'
const MODEL_URL = `https://huggingface.co/addisonbk/calorie-lens-onnx/resolve/${REVISION}/calorie_lens_image_fp32.onnx`
/** Tamaño y huella SHA-256 publicados por el autor de la exportación. */
export const MODEL_BYTES = 356_487_372
const MODEL_SHA256 = 'c19d3329d9df8fd6083f424c336fa435d9e87c26864b4c7181a0a4c10a618c16'
const CONFIG_URL = '/models/calorie-lens/config.json'
/** Archivo donde el navegador guarda el modelo (almacenamiento privado del sitio, OPFS). */
const MODEL_FILE = `calorie-lens-${REVISION.slice(0, 7)}.onnx`

/** Avance de la descarga del modelo, de 0 a 1 (1 si ya estaba guardado). */
export type DownloadProgress = (fraction: number) => void

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * El modelo guardado de una visita anterior. Se usa OPFS y no la caché del
 * navegador: Chrome rechaza guardar en la caché un archivo de este tamaño.
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
type Loaded = { ort: Ort; session: import('onnxruntime-web/webgpu').InferenceSession; config: PlateConfig }

let loading: Promise<Loaded> | null = null

/** Carga el modelo una sola vez por pestaña; si falla, el siguiente intento empieza de cero. */
export function loadPlateModel(onProgress: DownloadProgress): Promise<Loaded> {
  loading ??= (async () => {
    const ort = await import('onnxruntime-web/webgpu')
    // Los binarios de onnxruntime (WASM) se sirven desde jsDelivr, en la misma versión instalada.
    ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.env.versions.web}/dist/`
    const [buffer, config] = await Promise.all([
      downloadModel(onProgress),
      fetch(CONFIG_URL).then((response) => {
        if (!response.ok) throw new Error('No se pudo leer la configuración del modelo')
        return response.json() as Promise<PlateConfig>
      }),
    ])
    // WebGPU (tarjeta gráfica) es mucho más rápido; si el navegador no lo tiene o falla, WASM.
    const create = (executionProviders: string[]) =>
      ort.InferenceSession.create(buffer, { executionProviders, graphOptimizationLevel: 'all' })
    let session
    try {
      session = await create('gpu' in navigator ? ['webgpu', 'wasm'] : ['wasm'])
    } catch {
      session = await create(['wasm'])
    }
    return { ort, session, config }
  })().catch((error: unknown) => {
    loading = null
    throw error
  })
  return loading
}

/** Ingredientes, gramos y nutrientes del plato de la foto. */
export async function analyzePlate(photo: Blob, onProgress: DownloadProgress): Promise<PlateReadout> {
  const { ort, session, config } = await loadPlateModel(onProgress)
  const input = await imageToModelInput(photo)
  const outputs = await session.run({
    food_image: new ort.Tensor('float32', input, [1, 3, MODEL_HEIGHT, MODEL_WIDTH]),
  })
  return readPlate(
    {
      grams: outputs.grams.data as Float32Array,
      logits: outputs.logits.data as Float32Array,
      massGap: Number((outputs.mass_gap.data as Float32Array)[0]),
      logTotals: outputs.log_totals.data as Float32Array,
    },
    config,
  )
}
