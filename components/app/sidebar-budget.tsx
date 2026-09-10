'use client'

import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/format'
import { usePlan } from '@/hooks/use-plan'

export function SidebarBudget() {
  const { budget } = usePlan()

  return (
    <div className="rounded-xl bg-sidebar-accent/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-sidebar-foreground/70">Presupuesto semanal</span>
      </div>
      <p className="mt-1 font-display text-xl font-bold text-sidebar-foreground">
        {formatCurrency(budget.estimatedTotal)}
        <span className="text-sm font-normal text-sidebar-foreground/60">
          {' '}
          / {formatCurrency(budget.budget)}
        </span>
      </p>
      <Progress value={Math.min(budget.usedPercent, 100)} className="mt-3 h-1.5 bg-sidebar/60" />
      <p className="mt-2 text-xs text-sidebar-foreground/70">
        {budget.remaining >= 0
          ? `Te quedan ${formatCurrency(budget.remaining)}`
          : `Excedido por ${formatCurrency(Math.abs(budget.remaining))}`}
      </p>
    </div>
  )
}
