import { ListChecks, Salad, Sparkles, Store, PiggyBank, HeartPulse } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Salad,
    title: 'Menús a tu medida',
    description:
      'Planes de desayuno, almuerzo y cena adaptados a tu presupuesto, número de personas y preferencias.',
  },
  {
    icon: PiggyBank,
    title: 'Control de presupuesto',
    description:
      'Define cuánto quieres gastar por semana y visualiza en tiempo real cuánto llevas y cuánto ahorras.',
  },
  {
    icon: ListChecks,
    title: 'Lista de compras automática',
    description:
      'Genera tu lista a partir del menú, organizada por categorías y marcable mientras compras.',
  },
  {
    icon: Store,
    title: 'Comparador de precios',
    description:
      'Compara precios entre mercados, bodegas y supermercados para comprar donde más conviene.',
  },
  {
    icon: HeartPulse,
    title: 'Balance nutricional',
    description:
      'Revisa calorías, proteínas y fibra de tu semana para asegurar una alimentación equilibrada.',
  },
  {
    icon: Sparkles,
    title: 'Recomendaciones útiles',
    description:
      'Consejos de ahorro y nutrición personalizados, listos para escalar con inteligencia artificial.',
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="bg-card py-16 lg:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Todo lo que tu hogar necesita para comer mejor
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Una sola plataforma para planificar, comprar y cuidar la nutrición de
            tu familia sin salirte del presupuesto.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border bg-background transition-shadow hover:shadow-md">
              <CardHeader>
                <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <CardTitle className="pt-2 font-display text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
