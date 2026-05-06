import type { ProductionStepRow } from '@/app/dashboard/production/actions'

interface BottleneckCardProps {
  step: ProductionStepRow | undefined
}

export function BottleneckCard({ step }: BottleneckCardProps) {
  if (!step) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Gargalo Atual
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre as etapas de produção para identificar o gargalo automaticamente.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 dark:bg-destructive/10">
      <p className="text-xs font-medium uppercase tracking-wide text-destructive">
        ⚠ Gargalo Atual
      </p>
      <p className="mt-1 text-2xl font-semibold">{step.step_name}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {step.sku_family} · {step.capacity_per_day.toFixed(1)} un/dia ·{' '}
        {step.operators} op. · {step.machines} máq.
      </p>
      <p className="mt-3 text-sm font-medium text-destructive/80">
        Toda produção deve ser subordinada a esta etapa.
      </p>
    </div>
  )
}
