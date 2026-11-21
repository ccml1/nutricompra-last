/**
 * Genera public/models/clip-foods/text-embeddings.json: el vector de CLIP
 * (openai/clip-vit-base-patch16, exportado a ONNX por Xenova) de cada alimento
 * reconocible de lib/plate/food-table.json. Se corre una vez, cuando cambia la lista;
 * así el navegador solo necesita la parte de visión del modelo.
 *
 * Uso (no agrega dependencias al proyecto):
 *   npm install --no-save @huggingface/transformers@4.3.2
 *   node scripts/build-food-embeddings.mjs
 *
 * En Windows, si la ruta del caché es muy larga, define HF_CACHE_DIR con una carpeta corta.
 */
import { AutoTokenizer, CLIPTextModelWithProjection, env } from '@huggingface/transformers'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const MODEL = 'Xenova/clip-vit-base-patch16'
const REVISION = '342fdf2f67aded64d138ff074745fb4a5d2bba5f'
/** Varias frases por alimento, promediadas: CLIP reconoce mejor con contexto. */
const TEMPLATES = ['a photo of {}, a type of food.', 'a plate of food with {}.']

if (process.env.HF_CACHE_DIR) env.cacheDir = process.env.HF_CACHE_DIR

const foods = JSON.parse(readFileSync(new URL('../lib/plate/food-table.json', import.meta.url), 'utf8')).filter((food) => food.label)
const tokenizer = await AutoTokenizer.from_pretrained(MODEL, { revision: REVISION })
const model = await CLIPTextModelWithProjection.from_pretrained(MODEL, { revision: REVISION, dtype: 'q8' })

const normalize = (vector) => {
  const norm = Math.hypot(...vector)
  return vector.map((value) => value / norm)
}

const embeddings = []
for (const food of foods) {
  const prompts = TEMPLATES.map((template) => template.replace('{}', food.label))
  const { text_embeds: output } = await model(tokenizer(prompts, { padding: true, truncation: true }))
  const dim = output.dims[1]
  const rows = prompts.map((_, i) => normalize(Array.from(output.data.slice(i * dim, (i + 1) * dim))))
  const mean = normalize(rows[0].map((_, j) => rows.reduce((sum, row) => sum + row[j], 0)))
  embeddings.push({ name: food.name, embedding: mean.map((value) => Number(value.toFixed(5))) })
}

const out = new URL('../public/models/clip-foods/', import.meta.url)
mkdirSync(out, { recursive: true })
writeFileSync(
  new URL('text-embeddings.json', out),
  JSON.stringify({ model: MODEL, revision: REVISION, templates: TEMPLATES, foods: embeddings }),
)
console.log(`${embeddings.length} alimentos → public/models/clip-foods/text-embeddings.json`)
