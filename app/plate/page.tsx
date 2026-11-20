'use client'

import { useEffect, useState } from 'react'
import { Camera, Loader2, Menu, RotateCcw, ScanLine } from 'lucide-react'
import { AppSidebar } from '@/components/app/app-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { pressableClass } from '@/lib/pressable'
import { displayIngredient } from '@/lib/plate/ingredients-es'
import { analyzePlate } from '@/lib/plate/model'
import { scaleToPlateWeight, type PlateItem, type PlateReadout } from '@/lib/plate/readout'

type Status =
  | { step: 'idle' }
  | { step: 'preparing' }
  | { step: 'downloading'; progress: number }
  | { step: 'analyzing' }
  | { step: 'done'; plate: PlateReadout }
  | { step: 'error'; message: string }

/** Nutrientes del resumen, después de las calorías. */
const summaryItems = [
  { key: 'protein_g', label: 'Proteínas', unit: 'g' },
  { key: 'carb_g', label: 'Carbohidratos', unit: 'g' },
  { key: 'fat_g', label: 'Grasas', unit: 'g' },
  { key: 'fiber_g', label: 'Fibra', unit: 'g' },
  { key: 'sugars_g', label: 'Azúcares', unit: 'g' },
  { key: 'sodium_mg', label: 'Sodio', unit: 'mg' },
] as const

const number = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })

function IngredientRow({ item, name }: { item: PlateItem; name: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="text-[15px] font-medium">{name}</span>
      <span className="flex shrink-0 items-baseline gap-3 tabular-nums">
        <span className="text-sm text-muted-foreground">{number.format(item.grams)} g</span>
        <span className="w-20 text-right text-sm font-semibold">{number.format(item.kcal)} kcal</span>
      </span>
    </li>
  )
}

export default function PlatePage() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [plateGrams, setPlateGrams] = useState('')
  const [status, setStatus] = useState<Status>({ step: 'idle' })

  // La vista previa usa una URL local de la foto; se libera al cambiarla.
  useEffect(() => {
    if (!photo) return
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const working = status.step === 'preparing' || status.step === 'downloading' || status.step === 'analyzing'

  const analyze = async () => {
    if (!photo) return
    // Hasta saber si el modelo ya está guardado, no se habla de descarga.
    setStatus({ step: 'preparing' })
    try {
      const plate = await analyzePlate(photo, (progress) =>
        setStatus(progress < 1 ? { step: 'downloading', progress } : { step: 'analyzing' }),
      )
      setStatus({ step: 'done', plate })
    } catch (error) {
      console.error('No se pudo analizar la foto:', error)
      setStatus({ step: 'error', message: 'No pudimos analizar la foto. Revisa tu conexión e inténtalo de nuevo.' })
    }
  }

  // Con el peso real del plato, todo se escala; sin él, se muestra lo que estima el modelo.
  const weight = Number(plateGrams.replace(',', '.'))
  const plate =
    status.step === 'done' ? (weight > 0 ? scaleToPlateWeight(status.plate, weight) : status.plate) : null
  const other = plate && plate.other.grams >= 1 ? plate.other : null

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
              <p className="mt-0.5 text-sm text-muted-foreground">Calcula las calorías y nutrientes de tu comida con una foto</p>
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
                      <span className="px-6 text-xs text-muted-foreground">Mejor desde arriba, con todo el plato a la vista</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    aria-label="Elegir la foto del plato"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        setPhoto(file)
                        setStatus({ step: 'idle' })
                      }
                    }}
                  />
                </label>

                <div className="flex flex-1 flex-col gap-4">
                  <div>
                    <label htmlFor="plate-grams" className="text-sm font-medium">
                      Peso del plato <span className="font-normal text-muted-foreground">(opcional)</span>
                    </label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Input
                        id="plate-grams"
                        inputMode="decimal"
                        placeholder="Ej. 350"
                        value={plateGrams}
                        onChange={(event) => setPlateGrams(event.target.value)}
                        className="h-11 w-32 rounded-xl text-base md:text-base"
                      />
                      <span className="text-sm text-muted-foreground">gramos, sin el plato</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">Si lo pesas, el cálculo es mucho más exacto.</p>
                  </div>

                  <Button onClick={analyze} disabled={!photo || working} className="h-11 rounded-xl text-base">
                    {working ? <Loader2 className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : <ScanLine data-icon="inline-start" />}
                    {status.step === 'done' ? 'Volver a calcular' : 'Calcular calorías'}
                  </Button>

                  <div role="status" className="text-sm text-muted-foreground">
                    {status.step === 'downloading' && (
                      <div className="flex flex-col gap-2">
                        <span>Descargando el modelo (solo la primera vez, ~360 MB): {Math.round(status.progress * 100)} %</span>
                        <Progress value={status.progress * 100} aria-label="Descarga del modelo" />
                      </div>
                    )}
                    {status.step === 'preparing' && <span>Preparando el modelo…</span>}
                    {status.step === 'analyzing' && <span>Analizando la foto…</span>}
                    {status.step === 'error' && (
                      <span className="flex items-center gap-2 text-destructive">
                        {status.message}
                        <button type="button" onClick={analyze} className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline">
                          <RotateCcw className="size-3.5" aria-hidden="true" /> Reintentar
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {plate && (
              <section aria-label="Resultado" className="overflow-clip rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 px-4 py-5 sm:px-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Calorías del plato</p>
                    <p className="font-heading text-4xl font-bold tabular-nums">
                      {number.format(plate.totals.kcal)} <span className="text-xl font-semibold text-muted-foreground">kcal</span>
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {weight > 0 ? 'Peso del plato' : 'Peso estimado'}: <span className="font-semibold text-foreground tabular-nums">{number.format(plate.totals.mass_g)} g</span>
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-px bg-border/60 sm:grid-cols-3">
                  {summaryItems.map((item) => (
                    <div key={item.key} className="bg-card px-4 py-3 sm:px-6">
                      <dt className="text-xs text-muted-foreground">{item.label}</dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {item.unit === 'mg' ? number.format(plate.totals[item.key]) : decimal.format(plate.totals[item.key])} {item.unit}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="px-4 py-4 sm:px-6">
                  <h2 className="text-base font-semibold">Lo que vemos en el plato</h2>
                  {plate.ingredients.length === 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No reconocimos ingredientes con seguridad; las calorías salen del plato completo.
                    </p>
                  )}
                  <ul className="mt-1 divide-y divide-border/60">
                    {plate.ingredients.map((item) => (
                      <IngredientRow key={item.name} item={item} name={displayIngredient(item.name)} />
                    ))}
                    {other && <IngredientRow item={other} name="Otros (sin identificar)" />}
                  </ul>
                </div>
              </section>
            )}

            <p className="px-4 text-center text-xs leading-relaxed text-muted-foreground">
              Estimación aproximada hecha en tu equipo con el modelo Calorie Lens (Hugging Face); la foto no se envía a ningún servidor.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
