const steps = [
  {
    step: '01',
    title: 'Cuéntanos sobre tu hogar',
    description:
      'Indica cuántas personas viven contigo, tu presupuesto semanal y tus preferencias alimentarias.',
  },
  {
    step: '02',
    title: 'Recibe tu menú y tu lista',
    description:
      'Generamos un menú equilibrado para toda la semana y su lista de compras organizada por categorías.',
  },
  {
    step: '03',
    title: 'Compra donde más ahorras',
    description:
      'Compara precios entre establecimientos, marca lo que compras y controla tu gasto en tiempo real.',
  },
]

export function LandingSteps() {
  return (
    <section id="como-funciona" className="py-16 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            En tres pasos, tu semana resuelta
          </h2>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map(({ step, title, description }) => (
            <li key={step} className="relative flex flex-col gap-3">
              <span className="font-display text-5xl font-extrabold text-secondary">
                {step}
              </span>
              <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
