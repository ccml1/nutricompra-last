import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'

interface AuthShellProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="/images/auth-market.png"
          alt="Puesto de mercado con frutas y verduras frescas"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-sidebar/70" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/">
            <Logo tone="light" />
          </Link>
          <blockquote className="max-w-sm">
            <p className="text-balance font-display text-2xl font-semibold leading-snug text-sidebar-foreground">
              &ldquo;Planificar la semana me ayuda a comer mejor y a no salirme
              del presupuesto.&rdquo;
            </p>
            <footer className="mt-3 text-sm text-sidebar-foreground/70">
              Una familia como la tuya
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
