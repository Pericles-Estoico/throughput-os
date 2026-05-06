import { cn } from '@/lib/utils'
import type { DailyAlert } from '@/types'

interface AlertListProps {
  alerts: DailyAlert[]
}

export function AlertList({ alerts }: AlertListProps) {
  if (!alerts.length) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Nenhum alerta ativo — sistema saudável.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert, i) => (
        <li
          key={i}
          className={cn(
            'flex items-start gap-3 rounded-md px-3 py-2.5 text-sm',
            alert.priority === 'critical' &&
              'bg-destructive/10 text-destructive dark:bg-destructive/20',
            alert.priority === 'warning' &&
              'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400',
            alert.priority === 'info' && 'bg-muted text-muted-foreground'
          )}
        >
          <span className="mt-0.5 shrink-0">
            {alert.priority === 'critical' ? '🔴' : alert.priority === 'warning' ? '🟡' : 'ℹ️'}
          </span>
          <span>{alert.message}</span>
        </li>
      ))}
    </ul>
  )
}
