import { Home, ListChecks, Store, type LucideIcon } from 'lucide-react'

const steps: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Cuéntanos sobre tu hogar',
    description: 'Indica cuántas personas viven contigo, tu presupuesto semanal y tus preferencias alimentarias.',
    icon: Home,
  },
  {
    title: 'Recibe tu menú y tu lista',
    description: 'Generamos un menú equilibrado para toda la semana y su lista de compras organizada por categorías.',
    icon: ListChecks,
  },
  {
    title: 'Compra donde más ahorras',
    description: 'Compara precios entre establecimientos, marca lo que compras y controla tu gasto en tiempo real.',
    icon: Store,
  },
]

export function LandingSteps() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-secondary/40 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            En tres pasos, tu semana resuelta
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">De tu primera respuesta a tu lista de compras en unos minutos.</p>
        </div>

        <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* La línea une los pasos: vertical en celular, horizontal en pantallas anchas. */}
          <span aria-hidden className="absolute bottom-8 left-7 top-8 w-0.5 bg-primary/20 md:inset-x-[16%] md:bottom-auto md:left-[16%] md:top-7 md:h-0.5 md:w-auto" />
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
              <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-2xl font-extrabold text-primary-foreground shadow-[0_6px_16px_-6px_rgb(46_125_50/0.6)] ring-4 ring-background">
                {index + 1}
              </span>
              <div className="flex flex-col gap-2 pt-1 md:items-center md:pt-0">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
                  <Icon className="size-5 text-primary" aria-hidden />
                  {title}
                </h3>
                <p className="max-w-xs text-pretty text-[15px] leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
