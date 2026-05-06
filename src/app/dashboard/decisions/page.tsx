import { getSKUMetrics } from './actions'
import { SKUClassificationTable } from '@/components/decisions/sku-classification-table'
import type { SKUClassification } from '@/types'

const classColors: Record<SKUClassification, string> = {
  A: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  D: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
}

const classLabels: Record<SKUClassification, string> = {
  A: 'Escalar',
  B: 'Manter',
  C: 'Reduzir',
  D: 'Eliminar',
}

export default async function DecisionsPage() {
  const metrics = await getSKUMetrics()

  const counts = metrics.reduce(
    (acc, m) => {
      acc[m.classification] = (acc[m.classification] ?? 0) + 1
      return acc
    },
    {} as Record<SKUClassification, number>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Decision Engine</h1>
        <p className="text-sm text-muted-foreground">
          Classificação A/B/C/D com base nos últimos 30 dias — eliminando interpretação subjetiva
        </p>
      </div>

      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['A', 'B', 'C', 'D'] as SKUClassification[]).map((cls) => (
            <div
              key={cls}
              className={`rounded-lg border px-4 py-3 ${classColors[cls]}`}
            >
              <p className="text-2xl font-bold tabular-nums">{counts[cls] ?? 0}</p>
              <p className="text-xs font-medium opacity-80">
                SKUs {classLabels[cls]}
              </p>
            </div>
          ))}
        </div>
      )}

      {metrics.length === 0 ? (
        <div className="rounded-lg border border-dashed p-14 text-center space-y-2">
          <p className="font-medium text-muted-foreground">Nenhum dado disponível.</p>
          <p className="text-sm text-muted-foreground">
            Cadastre SKUs ativos e registre vendas em{' '}
            <a href="/dashboard/sales" className="underline underline-offset-2">
              Sales Intelligence
            </a>{' '}
            para ver a classificação.
          </p>
        </div>
      ) : (
        <SKUClassificationTable data={metrics} />
      )}
    </div>
  )
}
