import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  /** Variante de color del texto según el fondo. */
  tone?: 'default' | 'light'
  showText?: boolean
}

export function Logo({ className, tone = 'default', showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Leaf className="size-5" aria-hidden />
      </span>
      {showText && (
        <span
          className={cn(
            'font-display text-lg font-bold tracking-tight',
            tone === 'light' ? 'text-sidebar-foreground' : 'text-foreground',
          )}
        >
          Nutri<span className="text-primary">Compra</span>
        </span>
      )}
    </div>
  )
}
