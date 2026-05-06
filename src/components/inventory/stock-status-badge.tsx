import { cn } from '@/lib/utils'
import type { StockStatus } from '@/types'

const config: Record<StockStatus, { label: string; className: string }> = {
  ruptura: {
    label: 'Ruptura',
    className: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  },
  saudavel: {
    label: 'Saudável',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
  },
  excesso: {
    label: 'Excesso',
    className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400',
  },
}

interface StockStatusBadgeProps {
  status: StockStatus
}

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const { label, className } = config[status]
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', className)}>
      {label}
    </span>
  )
}
