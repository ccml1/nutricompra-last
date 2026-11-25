'use client'

import { ChevronDown, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/brand/logo'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { usePlan } from '@/hooks/use-plan'
import { formatCurrency } from '@/lib/format'
import { householdItem, isActive, navGroups } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { UserMenu } from './user-menu'

const [weekGroup, healthGroup] = navGroups

const topLinkClass = (active: boolean) =>
  cn(
    'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )

/** Cuánto del presupuesto semanal va del plan: siempre a la vista, lleva a la lista de compras. */
function BudgetChip({ className }: { className?: string }) {
  const { budget } = usePlan()
  const over = budget.remaining < 0
  return (
    <Link
      href="/shopping-list"
      className={cn(
        'flex flex-col gap-1 rounded-full px-3.5 py-1.5 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label={`Gasto de la semana: ${formatCurrency(budget.estimatedTotal)} de ${formatCurrency(budget.budget)}`}
    >
      <span className="tabular-nums text-muted-foreground">
        <span className={cn('font-semibold', over ? 'text-destructive' : 'text-foreground')}>
          {formatCurrency(budget.estimatedTotal)}
        </span>{' '}
        de {formatCurrency(budget.budget)}
      </span>
      <Progress value={Math.min(budget.usedPercent, 100)} aria-hidden className="h-1 w-full" />
    </Link>
  )
}

function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { budget } = usePlan()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu className="size-6" aria-hidden />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[86vw] max-w-sm gap-0 overflow-y-auto p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <div className="flex h-16 items-center border-b border-border px-5">
            <Logo />
          </div>
          <nav aria-label="Secciones" className="flex flex-col gap-6 px-3 py-5">
            {[...navGroups, { label: 'Tu cuenta', items: [householdItem] }].map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <p className="px-3 pb-1 text-xs font-semibold text-muted-foreground">{group.label}</p>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-12 items-center gap-3 rounded-xl px-3 transition-colors',
                        active ? 'bg-secondary text-secondary-foreground' : 'text-foreground hover:bg-muted',
                      )}
                    >
                      <Icon className={cn('size-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                      <span className="flex flex-col">
                        <span className="text-[15px] font-medium leading-tight">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
          <div className="mt-auto border-t border-border px-5 py-4">
            <p className="text-xs text-muted-foreground">Gasto de la semana</p>
            <p className="mt-0.5 font-display text-lg font-bold tabular-nums">
              {formatCurrency(budget.estimatedTotal)}{' '}
              <span className="text-sm font-normal text-muted-foreground">de {formatCurrency(budget.budget)}</span>
            </p>
            <Progress value={Math.min(budget.usedPercent, 100)} aria-hidden className="mt-2 h-1.5" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/** Barra superior de la app: secciones de la semana a la vista, las de salud agrupadas y la cuenta a la derecha. */
export function AppHeader() {
  const pathname = usePathname()
  const healthActive = healthGroup.items.some((item) => isActive(pathname, item.href))

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/dashboard" aria-label="NutriCompra, ir al inicio" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>

        <nav aria-label="Secciones" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {weekGroup.items.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={topLinkClass(active)}>
                {item.short ?? item.label}
              </Link>
            )
          })}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(topLinkClass(healthActive), 'cursor-pointer')}>
              {healthGroup.label}
              <ChevronDown className="size-4 opacity-70" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-72 p-1.5">
              {healthGroup.items.map((item) => {
                const Icon = item.icon
                const active = isActive(pathname, item.href)
                return (
                  <DropdownMenuItem
                    key={item.href}
                    render={<Link href={item.href} aria-current={active ? 'page' : undefined} />}
                    className={cn('items-start gap-3 rounded-lg px-2.5 py-2', active && 'bg-secondary')}
                  >
                    <Icon className="mt-0.5 size-5 text-primary" aria-hidden />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <BudgetChip className="hidden sm:flex" />
          <UserMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
