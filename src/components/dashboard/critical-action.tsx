import type { DailyAlert } from '@/types'

interface CriticalActionProps {
  alert?: DailyAlert
}

export function CriticalAction({ alert }: CriticalActionProps) {
  const message =
    alert?.message ??
    'Todos os indicadores estão saudáveis. Continue monitorando os dados.'

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Ação Crítica do Dia
      </p>
      <p className="mt-2 text-lg font-medium">{message}</p>
    </div>
  )
}
