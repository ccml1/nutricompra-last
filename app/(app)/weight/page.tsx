'use client'

import { useEffect, useState } from 'react'
import { Camera, Loader2, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { usePlan } from '@/hooks/use-plan'
import { activityLevels, bodyMassIndex, dailyNeeds, menuCoverage, type ActivityLevel } from '@/lib/body/energy'
import { weekNutritionAverage } from '@/lib/nutrition'
import { photoToJpegDataUrl } from '@/lib/plate/preprocess'
import { pressableClass } from '@/lib/pressable'
import { ApiError, estimateWeightFromPhoto } from '@/services/data-service'
import type { Sex, WeightEstimate } from '@/types'

type Status = { step: 'idle' } | { step: 'analyzing' } | { step: 'error'; message: string }

const whole = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })
const toNumber = (text: string) => Number(text.replace(',', '.'))

/** Lado mayor de la foto que se envía: suficiente para ver la silueta. */
const UPLOAD_MAX_SIDE = 800

const fieldClass = `h-11 rounded-xl bg-card px-3 text-base text-foreground shadow-sm ring-1 ring-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`

export default function WeightPage() {
  const { plan } = usePlan()
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [sex, setSex] = useState<Sex | null>(null)
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState<ActivityLevel>('light')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>({ step: 'idle' })
  const [estimate, setEstimate] = useState<WeightEstimate | null>(null)
  /** El peso con el que se calcula: el estimado, o el que la persona corrige o escribe. */
  const [weight, setWeight] = useState('')
  const [manual, setManual] = useState(false)

  useEffect(() => {
    if (!photo) return
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  // Si el modelo está ocupado, el backend espera su turno (hasta ~30 s): se avisa para que no parezca colgado.
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (status.step !== 'analyzing') return setSlow(false)
    const timer = setTimeout(() => setSlow(true), 6000)
    return () => clearTimeout(timer)
  }, [status.step])

  const ageValue = toNumber(age)
  const heightValue = toNumber(height)
  const ageOk = ageValue >= 18 && ageValue <= 100
  const heightOk = heightValue >= 120 && heightValue <= 230
  const profileOk = sex !== null && ageOk && heightOk
  const canEstimate = profileOk && photo !== null && consent && status.step !== 'analyzing'

  const estimateWeight = async () => {
    if (!canEstimate || !photo || !sex) return
    setStatus({ step: 'analyzing' })
    try {
      const image = await photoToJpegDataUrl(photo, UPLOAD_MAX_SIDE)
      const result = await estimateWeightFromPhoto({ image, sex, age: Math.round(ageValue), heightCm: Math.round(heightValue) })
      setEstimate(result)
      setWeight(String(result.weightKg))
      setManual(false)
      setStatus({ step: 'idle' })
    } catch (error) {
      console.warn('No se pudo estimar el peso:', error)
      const message =
        error instanceof ApiError && [400, 413, 422, 429].includes(error.status)
          ? error.message
          : 'No pudimos analizar la foto. Revisa tu conexión e inténtalo de nuevo.'
      setStatus({ step: 'error', message })
    }
  }

  const weightValue = toNumber(weight)
  const weightOk = weightValue >= 25 && weightValue <= 300
  const showResults = (estimate !== null || manual) && profileOk && sex !== null
  const needs = showResults && weightOk ? dailyNeeds(sex, weightValue, heightValue, ageValue, activity) : null
  const bmi = needs ? bodyMassIndex(weightValue, heightValue) : null
  const menu = weekNutritionAverage(plan)
  const coverage = needs ? menuCoverage(needs, menu) : null

  return (
    <div className="min-h-screen bg-muted/30">
      <main>
        <header className="border-b bg-background/90 px-5 py-5 backdrop-blur lg:px-10">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Mi peso y calorías</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Estima tu peso con una foto y mira cuánto necesitas comer</p>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 sm:py-8 lg:px-10">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <section aria-label="Tus datos" className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <label
                  className={`relative flex aspect-[3/4] w-full shrink-0 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-muted/60 text-center ring-1 ring-border/70 sm:w-56 ${pressableClass}`}
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- foto local del usuario, sin optimizar
                    <img src={preview} alt="Foto de cuerpo entero elegida" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <>
                      <Camera className="size-8 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm font-medium">Foto de cuerpo entero</span>
                      <span className="px-6 text-xs text-muted-foreground">De frente, de la cabeza a los pies, con ropa ajustada</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-label="Elegir la foto de cuerpo entero"
                    disabled={status.step === 'analyzing'}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        // Una foto nueva deja atrás la estimación anterior (lo escrito a mano se mantiene).
                        setPhoto(file)
                        setStatus({ step: 'idle' })
                        if (!manual) setEstimate(null)
                      }
                      event.target.value = ''
                    }}
                  />
                </label>

                <div className="flex flex-1 flex-col gap-4">
                  <fieldset className="flex flex-col gap-1.5">
                    <legend className="mb-1.5 text-sm font-medium">Sexo</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ['female', 'Mujer'],
                          ['male', 'Hombre'],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={sex === value}
                          onClick={() => setSex(value)}
                          className={`h-11 rounded-xl text-base font-medium ring-1 transition-colors ${pressableClass} ${
                            sex === value ? 'bg-primary text-primary-foreground ring-primary' : 'bg-card ring-border/70 hover:bg-muted'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">Edad</span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" aria-invalid={age !== '' && !ageOk} className="h-11 rounded-xl text-base md:text-base" />
                        años
                      </span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">Estatura</span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="165" aria-invalid={height !== '' && !heightOk} className="h-11 rounded-xl text-base md:text-base" />
                        cm
                      </span>
                    </label>
                  </div>
                  {age !== '' && !ageOk && <p className="-mt-2 text-xs text-destructive">Solo para adultos: de 18 a 100 años.</p>}
                  {height !== '' && !heightOk && <p className="-mt-2 text-xs text-destructive">La estatura va de 120 a 230 cm.</p>}

                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Actividad física</span>
                    <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)} className={`cursor-pointer ${fieldClass} ${pressableClass}`}>
                      {Object.entries(activityLevels).map(([key, level]) => (
                        <option key={key} value={key}>
                          {level.label} · {level.hint}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary" />
                    <span>Tengo 18 años o más y la foto es mía.</span>
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => void estimateWeight()} disabled={!canEstimate} className="h-11 rounded-xl px-5">
                      {status.step === 'analyzing' ? <Loader2 data-icon="inline-start" className="animate-spin motion-reduce:animate-none" /> : <Scale data-icon="inline-start" />}
                      Estimar mi peso
                    </Button>
                    {!manual && estimate === null && (
                      <button type="button" onClick={() => setManual(true)} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                        Ya sé mi peso
                      </button>
                    )}
                  </div>
                  <div role="status" className="text-sm">
                    {status.step === 'analyzing' && (
                      <span className="text-muted-foreground">{slow ? 'Hay varias fotos en cola; unos segundos más…' : 'Analizando la foto…'}</span>
                    )}
                    {status.step === 'error' && <span className="text-destructive">{status.message}</span>}
                  </div>
                </div>
              </div>
            </section>

            {showResults && (
              <section aria-label="Tu resultado" className="overflow-clip rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 px-4 py-5 sm:px-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{estimate && !manual ? 'Tu peso aproximado' : 'Tu peso'}</p>
                    {estimate && !manual && (
                      <>
                        <p className="font-heading text-4xl font-bold tabular-nums">
                          {whole.format(estimate.weightKg)} <span className="text-xl font-semibold text-muted-foreground">kg</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Entre {whole.format(estimate.lowKg)} y {whole.format(estimate.highKg)} kg
                        </p>
                      </>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {estimate && !manual ? '¿Sabes tu peso? Corrígelo:' : 'Escribe tu peso:'}
                    <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} aria-label="Peso en kilos" className="h-10 w-20 rounded-xl text-right text-base tabular-nums md:text-base" />
                    kg
                  </label>
                </div>

                {needs && bmi && coverage ? (
                  <>
                    <dl className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-3">
                      <div className="bg-card px-4 py-3 sm:px-6">
                        <dt className="text-xs text-muted-foreground">IMC</dt>
                        <dd className="text-lg font-semibold tabular-nums">
                          {decimal.format(bmi.value)} <span className="text-sm font-medium text-muted-foreground">· {bmi.label}</span>
                        </dd>
                      </div>
                      <div className="bg-card px-4 py-3 sm:px-6">
                        <dt className="text-xs text-muted-foreground">Calorías al día</dt>
                        <dd className="text-lg font-semibold tabular-nums">{whole.format(needs.kcal)} kcal</dd>
                      </div>
                      <div className="bg-card px-4 py-3 sm:px-6">
                        <dt className="text-xs text-muted-foreground">Proteína al día</dt>
                        <dd className="text-lg font-semibold tabular-nums">
                          {whole.format(needs.proteinMinG)} a {whole.format(needs.proteinMaxG)} g
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
                      <div>
                        <h2 className="text-base font-semibold">¿Te alcanza tu menú semanal?</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          En promedio, tu menú te da {whole.format(menu.calories)} kcal y {whole.format(menu.protein)} g de proteína al día por persona.
                        </p>
                      </div>
                      {[
                        {
                          label: 'Calorías',
                          pct: coverage.kcalPct,
                          note:
                            coverage.kcalPct < 90
                              ? 'Te quedas corto: suma porciones o un refrigerio.'
                              : coverage.kcalPct > 115
                                ? 'Pasas lo que necesitas: puedes reducir porciones.'
                                : 'Cubre bien lo que necesitas.',
                        },
                        {
                          label: 'Proteína (mínimo recomendado)',
                          pct: coverage.proteinPct,
                          note:
                            menu.protein < needs.proteinMinG
                              ? 'Te falta proteína: suma huevo, menestras, pescado o pollo.'
                              : menu.protein > needs.proteinMaxG
                                ? 'Más proteína de la necesaria; no hace falta sumar.'
                                : `Dentro de lo recomendado (${whole.format(needs.proteinMinG)} a ${whole.format(needs.proteinMaxG)} g).`,
                        },
                      ].map(({ label, pct, note }) => (
                        <div key={label} className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{label}</span>
                            <span className="tabular-nums text-muted-foreground">{whole.format(pct)} %</span>
                          </div>
                          <Progress value={Math.min(100, pct)} aria-label={`${label}: ${whole.format(pct)} % de lo que necesitas`} />
                          <p className="text-xs text-muted-foreground">{note}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="px-4 py-5 text-sm text-muted-foreground sm:px-6">Escribe un peso entre 25 y 300 kg para ver tus calorías.</p>
                )}
              </section>
            )}

            <p className="px-4 text-center text-xs leading-relaxed text-muted-foreground">
              Tu foto no se guarda. Es una estimación para adultos: no reemplaza una balanza ni el consejo de un profesional de salud.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
