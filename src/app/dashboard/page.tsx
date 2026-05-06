import {
  getDailyThroughput,
  getSkusASoldToday,
  getSkusInRupture,
  getCurrentBottleneck,
  getDailyAlerts,
} from './actions'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { AlertList } from '@/components/dashboard/alert-list'
import { CriticalAction } from '@/components/dashboard/critical-action'

export const dynamic = 'force-dynamic'

export default async function ExecutionDashboard() {
  const [throughput, skusASold, skusInRupture, bottleneck, alerts] = await Promise.all([
    getDailyThroughput(),
    getSkusASoldToday(),
    getSkusInRupture(),
    getCurrentBottleneck(),
    getDailyAlerts(),
  ])

  const criticalAlert = alerts.find((a) => a.priority === 'critical')

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Execução</h1>
        <p className="text-sm text-muted-foreground">O que você deve fazer hoje</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Ganho do dia" value={formatCurrency(throughput)} />
        <KpiCard label="SKUs A vendidos" value={String(skusASold)} />
        <KpiCard
          label="SKUs em ruptura"
          value={String(skusInRupture)}
          variant={skusInRupture > 0 ? 'danger' : 'default'}
        />
        <KpiCard label="Gargalo atual" value={bottleneck} />
      </div>

      <CriticalAction alert={criticalAlert} />

      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Alertas Automáticos
        </h2>
        <AlertList alerts={alerts} />
      </div>
    </div>
  )
}
