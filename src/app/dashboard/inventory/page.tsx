import { getInventoryData } from './actions'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { StockAlerts } from '@/components/inventory/stock-alerts'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const data = await getInventoryData()

  const rupturaCount = data.filter((r) => r.status === 'ruptura').length
  const excessoCount = data.filter((r) => r.status === 'excesso').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory Control</h1>
          <p className="text-sm text-muted-foreground">
            Estoque e cobertura por SKU — ordenado por risco
          </p>
        </div>
        {data.length > 0 && (
          <div className="flex gap-3 text-sm">
            {rupturaCount > 0 && (
              <span className="font-medium text-destructive">{rupturaCount} ruptura</span>
            )}
            {excessoCount > 0 && (
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {excessoCount} excesso
              </span>
            )}
          </div>
        )}
      </div>

      <StockAlerts data={data} />

      <InventoryTable data={data} />
    </div>
  )
}
