import type { InventoryRow } from '@/app/dashboard/inventory/actions'

interface StockAlertsProps {
  data: InventoryRow[]
}

export function StockAlerts({ data }: StockAlertsProps) {
  const ruptura = data.filter((r) => r.status === 'ruptura')
  const excesso = data.filter((r) => r.status === 'excesso')

  if (!ruptura.length && !excesso.length) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ruptura.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 dark:bg-destructive/10">
          <p className="text-xs font-medium uppercase tracking-wide text-destructive">
            ⚠ Atenção Imediata — {ruptura.length} em ruptura
          </p>
          <ul className="mt-2 space-y-1">
            {ruptura.map((r) => (
              <li key={r.sku_id} className="text-sm text-destructive">
                <span className="font-mono text-xs">{r.sku_code}</span>{' '}
                {r.product_name}
                {r.coverage_days < 999 && (
                  <span className="ml-1 text-xs opacity-70">({r.coverage_days.toFixed(1)}d)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {excesso.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
          <p className="text-xs font-medium uppercase tracking-wide text-yellow-700 dark:text-yellow-400">
            Excesso de Estoque — {excesso.length} SKUs
          </p>
          <ul className="mt-2 space-y-1">
            {excesso.slice(0, 5).map((r) => (
              <li key={r.sku_id} className="text-sm text-yellow-700 dark:text-yellow-400">
                <span className="font-mono text-xs">{r.sku_code}</span>{' '}
                {r.product_name}
                {r.coverage_days < 999 && (
                  <span className="ml-1 text-xs opacity-70">({Math.round(r.coverage_days)}d)</span>
                )}
              </li>
            ))}
            {excesso.length > 5 && (
              <li className="text-xs text-yellow-600 dark:text-yellow-500">
                +{excesso.length - 5} outros
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
