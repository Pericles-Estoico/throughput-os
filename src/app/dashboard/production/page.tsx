import { getProductionSteps } from './actions'
import { BottleneckCard } from '@/components/production/bottleneck-card'
import { ProductionTable } from '@/components/production/production-table'
import { ProductionStepForm } from '@/components/production/production-step-form'

export const dynamic = 'force-dynamic'

export default async function ProductionPage() {
  const steps = await getProductionSteps()
  const bottleneck = steps.find((s) => s.is_bottleneck)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Production Flow</h1>
          <p className="text-sm text-muted-foreground">
            Capacidade por etapa e identificação automática do gargalo
          </p>
        </div>
        <ProductionStepForm />
      </div>

      <BottleneckCard step={bottleneck} />

      <ProductionTable data={steps} />
    </div>
  )
}
