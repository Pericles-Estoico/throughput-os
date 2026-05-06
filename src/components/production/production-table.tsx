import { cn } from '@/lib/utils'
import type { ProductionStepRow } from '@/app/dashboard/production/actions'

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`
}

interface ProductionTableProps {
  data: ProductionStepRow[]
}

export function ProductionTable({ data }: ProductionTableProps) {
  if (!data.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma etapa cadastrada. Use o botão acima para registrar as etapas de produção.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Etapa</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Família</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Tempo/un</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Operadores</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Máquinas</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cap./dia</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fila</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-border last:border-0 transition-colors',
                row.is_bottleneck && 'bg-destructive/5 dark:bg-destructive/10'
              )}
            >
              <td className="px-4 py-3 font-medium">
                <span className="flex items-center gap-2">
                  {row.step_name}
                  {row.is_bottleneck && (
                    <span className="inline-flex items-center rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive dark:bg-destructive/20">
                      GARGALO
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.sku_family}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatSeconds(row.time_seconds)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.operators}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.machines}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium">
                {row.capacity_per_day.toFixed(1)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {row.queue_days > 0 ? `${row.queue_days.toFixed(1)}d` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
