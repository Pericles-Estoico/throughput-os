import { cn } from '@/lib/utils'
import { StockStatusBadge } from './stock-status-badge'
import type { InventoryRow } from '@/app/dashboard/inventory/actions'

function formatCoverage(days: number): string {
  if (days >= 999) return '—'
  return `${days.toFixed(1)}d`
}

function formatAvgSales(avg: number): string {
  if (avg === 0) return '—'
  return `${avg.toFixed(1)}`
}

interface InventoryTableProps {
  data: InventoryRow[]
}

export function InventoryTable({ data }: InventoryTableProps) {
  if (!data.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum dado de estoque encontrado. Importe o estoque de cada SKU para ver a cobertura.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Estoque Total</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Venda Média/dia</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cobertura</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.sku_id}
              className={cn(
                'border-b border-border last:border-0 transition-colors',
                row.status === 'ruptura' && 'bg-destructive/5 dark:bg-destructive/10'
              )}
            >
              <td className="px-4 py-3 font-mono text-xs">{row.sku_code}</td>
              <td className="px-4 py-3">{row.product_name}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.stock_total}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {formatAvgSales(row.avg_daily_sales)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium">
                {formatCoverage(row.coverage_days)}
              </td>
              <td className="px-4 py-3 text-center">
                <StockStatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
