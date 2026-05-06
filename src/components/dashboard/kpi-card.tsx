import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  variant?: 'default' | 'danger' | 'warning'
}

export function KpiCard({ label, value, variant = 'default' }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          variant === 'danger' && 'text-destructive',
          variant === 'warning' && 'text-yellow-600 dark:text-yellow-400'
        )}
      >
        {value}
      </p>
    </div>
  )
}
