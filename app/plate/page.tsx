'use client'

import { useEffect, useState } from 'react'
import { Camera, Loader2, Menu, RotateCcw, X } from 'lucide-react'
import { AppSidebar } from '@/components/app/app-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { entriesFromAnalysis, plateFromEntries, type PlateEntry } from '@/lib/plate/entries'
import { plateFoodByName, plateFoods } from '@/lib/plate/foods'
import { recognizeFoods } from '@/lib/plate/model'
import { photoToJpegDataUrl } from '@/lib/plate/preprocess'
import { pressableClass } from '@/lib/pressable'
import { analyzePlatePhoto, ApiError } from '@/services/data-service'

type Status =
  | { step: 'idle' }
  | { step: 'analyzing' }
  | { step: 'downloading'; progress: number }
  | { step: 'error'; message: string }

const summaryItems = [
  { key: 'proteinG', label: 'Proteínas' },
  { key: 'carbsG', label: 'Carbohidratos' },
  { key: 'fatG', label: 'Grasas' },
  { key: 'fiberG', label: 'Fibra' },
] as const

const whole = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })
const defaultGrams = (name: string) => String(plateFoodByName.get(name)?.portionG ?? 100)

export default function PlatePage() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ step: 'idle' })
  const [entries, setEntries] = useState<PlateEntry[]>([])
  const [dish, setDish] = useState<string | null>(null)
  /** Aviso cuando no respondió el modelo de visión y se usó el reconocimiento básico. */
  const [fallbackNote, setFallbackNote] = useState<string | null>(null)
  const [analyzed, setAnalyzed] = useState(false)

  // La vista previa usa una URL local de la foto; se libera al cambiarla.
  useEffect(() => {
    if (!photo) return
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const working = status.step === 'analyzing' || status.step === 'downloading'

  /** Si el modelo de visión no está disponible, el reconocimiento básico (CLIP, en el navegador) propone los alimentos. */
  const recognizeBasic = async (file: File, reason: string) => {
    const suggestions = await recognizeFoods(file, (progress) =>
      setStatus(progress < 1 ? { step: 'downloading', progress } : { step: 'analyzing' }),
    )
    setEntries(suggestions.map(({ name, probability }) => ({ name, probability, grams: defaultGrams(name) })))
    setDish(null)
    setFallbackNote(reason)
  }

  const analyze = async (file: File) => {
    setStatus({ step: 'analyzing' })
    setFallbackNote(null)
    try {
      const analysis = await analyzePlatePhoto(await photoToJpegDataUrl(file))
      setEntries(entriesFromAnalysis(analysis))
      setDish(analysis.dish)
      setStatus({ step: 'idle' })
    } catch (error) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 413)) {
        setStatus({ step: 'error', message: error.message })
        return
      }
      // Camino previsto (límite de Groq, sin conexión): se avisa en la consola, no es un error de la app.
      console.warn('El modelo de visión no respondió; se usa el reconocimiento básico:', error)
      try {
        const reason =
          error instanceof ApiError && error.status === 429
            ? 'El análisis detallado está ocupado; usamos el reconocimiento básico con porciones habituales.'
            : 'No hubo conexión con el análisis detallado; usamos el reconocimiento básico con porciones habituales.'
        await recognizeBasic(file, reason)
        setStatus({ step: 'idle' })
      } catch (fallbackError) {
        console.error('Tampoco funcionó el reconocimiento básico:', fallbackError)
        setStatus({ step: 'error', message: 'No pudimos analizar la foto. Revisa tu conexión e inténtalo de nuevo.' })
      }
    } finally {
      setAnalyzed(true)
    }
  }

  const choosePhoto = (file: File) => {
    setPhoto(file)
    setEntries([])
    setDish(null)
    setAnalyzed(false)
    void analyze(file)
  }

  const addFood = (name: string) => {
    if (!name || entries.some((entry) => entry.name === name)) return
    setEntries([...entries, { name, grams: defaultGrams(name) }])
  }

  const plate = plateFromEntries(entries)
  const kcalByName = new Map(plate.items.map((item) => [item.name, item.kcal]))
  const available = plateFoods.filter((food) => !entries.some((entry) => entry.name === food.name))

  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />
      <main className="lg:pl-64">
        <header className="border-b bg-background/90 px-5 py-5 backdrop-blur lg:px-10">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú">
              <Menu data-icon="inline-start" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Foto del plato</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Toma una foto y te decimos sus calorías y nutrientes</p>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 sm:py-8 lg:px-10">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <section aria-label="Foto" className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <label
                  className={`relative flex aspect-[4/3] w-full shrink-0 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-muted/60 text-center ring-1 ring-border/70 sm:w-72 ${pressableClass}`}
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- foto local del usuario, sin optimizar
                    <img src={preview} alt="Foto del plato elegida" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <>
                      <Camera className="size-8 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm font-medium">Tomar o subir una foto</span>
                      <span className="px-6 text-xs text-muted-foreground">Con todo el plato a la vista y buena luz</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    aria-label="Elegir la foto del plato"
                    disabled={working}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) choosePhoto(file)
                      event.target.value = ''
                    }}
                  />
                </label>

                <div className="flex flex-1 flex-col justify-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Al elegir la foto, la analizamos al momento: qué alimentos hay y cuántos gramos, y calculamos las calorías con la Tabla Peruana de Composición de Alimentos.
                  </p>
                  <div role="status" className="text-sm text-muted-foreground">
                    {status.step === 'analyzing' && (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Analizando la foto…
                      </span>
                    )}
                    {status.step === 'downloading' && (
                      <div className="flex flex-col gap-2">
                        <span>Preparando el reconocimiento básico (solo la primera vez, ~88 MB): {Math.round(status.progress * 100)} %</span>
                        <Progress value={status.progress * 100} aria-label="Descarga del modelo" />
                      </div>
                    )}
                    {status.step === 'error' && (
                      <span className="flex flex-wrap items-center gap-2 text-destructive">
                        {status.message}
                        {photo && (
                          <button type="button" onClick={() => void analyze(photo)} className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline">
                            <RotateCcw className="size-3.5" aria-hidden="true" /> Reintentar
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                  {photo && status.step === 'idle' && analyzed && (
                    <Button variant="outline" onClick={() => void analyze(photo)} className="h-10 self-start rounded-xl">
                      <RotateCcw data-icon="inline-start" /> Volver a analizar
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {analyzed && status.step !== 'error' && (
              <section aria-label="Alimentos del plato" className="overflow-clip rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 px-4 py-5 sm:px-6">
                  <div>
                    {dish && <p className="text-sm font-medium text-primary">{dish}</p>}
                    <p className="text-sm text-muted-foreground">Calorías del plato</p>
                    <p className="font-heading text-4xl font-bold tabular-nums">
                      {whole.format(plate.totals.kcal)} <span className="text-xl font-semibold text-muted-foreground">kcal</span>
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Peso del plato: <span className="font-semibold text-foreground tabular-nums">{whole.format(plate.totals.grams)} g</span>
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-px bg-border/60 sm:grid-cols-4">
                  {summaryItems.map((item) => (
                    <div key={item.key} className="bg-card px-4 py-3 sm:px-6">
                      <dt className="text-xs text-muted-foreground">{item.label}</dt>
                      <dd className="text-lg font-semibold tabular-nums">{decimal.format(plate.totals[item.key])} g</dd>
                    </div>
                  ))}
                </dl>

                <div className="px-4 py-4 sm:px-6">
                  <h2 className="text-base font-semibold">Lo que hay en tu plato</h2>
                  {fallbackNote && <p className="mt-1 text-xs text-muted-foreground">{fallbackNote}</p>}
                  {entries.length === 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">No vimos comida en la foto. Prueba con otra o agrega los alimentos a mano.</p>
                  )}
                  <ul className="mt-1 divide-y divide-border/60">
                    {entries.map((entry, i) => {
                      const cooked = !entry.per100g && (plateFoodByName.get(entry.name)?.cookedYield ?? 1) !== 1
                      return (
                        <li key={`${entry.name}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-medium">{entry.name}</p>
                            {entry.per100g && <p className="text-xs text-muted-foreground">Fuera de la tabla peruana · valor estimado</p>}
                            {entry.probability !== undefined && (
                              <p className="text-xs text-muted-foreground">Visto en la foto · {Math.round(entry.probability * 100)} %</p>
                            )}
                          </div>
                          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span className="sr-only">Gramos de {entry.name}</span>
                            <Input
                              inputMode="decimal"
                              value={entry.grams}
                              onChange={(event) =>
                                setEntries(entries.map((other, j) => (j === i ? { ...other, grams: event.target.value } : other)))
                              }
                              className="h-10 w-20 rounded-xl text-right text-base tabular-nums md:text-base"
                            />
                            g{cooked ? ' cocido' : ''}
                          </label>
                          <span className="w-20 text-right text-sm font-semibold tabular-nums">{whole.format(kcalByName.get(entry.name) ?? 0)} kcal</span>
                          <button
                            type="button"
                            aria-label={`Quitar ${entry.name}`}
                            onClick={() => setEntries(entries.filter((_, j) => j !== i))}
                            className={`flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground ${pressableClass}`}
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  <label className="mt-3 flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">¿Falta algo?</span>
                    <select
                      value=""
                      onChange={(event) => addFood(event.target.value)}
                      className={`h-11 cursor-pointer rounded-xl bg-card px-3 text-base text-foreground shadow-sm ring-1 ring-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pressableClass}`}
                    >
                      <option value="">Agregar un alimento…</option>
                      {available.map((food) => (
                        <option key={food.name} value={food.name}>
                          {food.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            )}

            <p className="px-4 text-center text-xs leading-relaxed text-muted-foreground">
              La foto se envía para analizarla con Qwen3.8, un modelo abierto de Hugging Face, y no se guarda. Es una estimación: los gramos y las calorías pueden variar.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
