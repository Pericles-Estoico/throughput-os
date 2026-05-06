import { Suspense } from 'react'
import { getSalesWithMetrics, getFilterOptions, getSkusForSelect } from './actions'
import { SalesTable } from '@/components/sales/sales-table'
import { SalesFilters } from '@/components/sales/sales-filters'
import { SaleFormDialog } from '@/components/sales/sale-form'

interface SalesPageProps {
  searchParams: Promise<{
    date_from?: string
    date_to?: string
    channel?: string
    category?: string
  }>
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const params = await searchParams

  const [sales, { channels, categories }, skus] = await Promise.all([
    getSalesWithMetrics(params),
    getFilterOptions(),
    getSkusForSelect(),
  ])

  const totalGanho = sales.reduce((sum, s) => sum + s.throughput_total, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Ganho real por SKU — ordenado por throughput total
          </p>
        </div>
        <SaleFormDialog skus={skus} />
      </div>

      {sales.length > 0 && (
        <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">Ganho total do período</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              totalGanho
            )}
          </p>
        </div>
      )}

      <Suspense fallback={<div className="h-10 rounded-md bg-muted/50 animate-pulse" />}>
        <SalesFilters channels={channels} categories={categories} />
      </Suspense>

      <SalesTable data={sales} />
    </div>
  )
}
