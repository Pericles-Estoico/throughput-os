'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateCapacity, identifyConstraint } from '@/lib/calculations'
import { productionStepSchema, type ProductionStepFormData } from './schema'

const TOTAL_MINUTES = 480
const EFFICIENCY = 0.85

export type ProductionStepRow = {
  id: string
  sku_family: string
  step_name: string
  time_seconds: number
  operators: number
  machines: number
  capacity_per_day: number
  queue_days: number
  is_bottleneck: boolean
}

// 1.1 — Buscar todas as etapas com capacidade e fila calculadas
export async function getProductionSteps(): Promise<ProductionStepRow[]> {
  try {
    const supabase = await createClient()

    const [{ data: steps }, { data: inventory }, { data: skus }] = await Promise.all([
      supabase
        .from('production_steps')
        .select('id, sku_family, step_name, time_seconds, operators, machines')
        .order('sku_family')
        .order('step_name'),
      supabase.from('inventory').select('sku_id, stock_semi'),
      supabase.from('skus').select('id, family').eq('active', true),
    ])

    if (!steps?.length) return []

    // Mapeia SKU → família para calcular fila por família
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const skuFamilyMap = Object.fromEntries((skus ?? []).map((s: any) => [s.id, s.family]))
    const familyStockSemi: Record<string, number> = {}
    for (const inv of inventory ?? []) {
      const family = skuFamilyMap[inv.sku_id]
      if (family) {
        familyStockSemi[family] = (familyStockSemi[family] ?? 0) + inv.stock_semi
      }
    }

    // 1.4 — Calcula capacidade por etapa
    const stepsWithCapacity = steps.map((s) => ({
      ...s,
      capacity_per_day: calculateCapacity(
        TOTAL_MINUTES,
        EFFICIENCY,
        s.operators,
        s.time_seconds / 60
      ),
    }))

    // 1.2 — Identifica o gargalo (menor capacidade)
    const bottleneckName = identifyConstraint(
      stepsWithCapacity.map((s) => ({
        step_name: s.step_name,
        capacity_per_day: s.capacity_per_day,
      }))
    )

    return stepsWithCapacity.map((s) => {
      const stockSemi = familyStockSemi[s.sku_family] ?? 0
      const queue_days = s.capacity_per_day > 0 ? stockSemi / s.capacity_per_day : 0
      return {
        id: s.id,
        sku_family: s.sku_family,
        step_name: s.step_name,
        time_seconds: s.time_seconds,
        operators: s.operators,
        machines: s.machines,
        capacity_per_day: s.capacity_per_day,
        queue_days,
        is_bottleneck: s.step_name === bottleneckName,
      }
    })
  } catch {
    return []
  }
}

// 1.2 — Etapa com menor capacidade (consulta direta para uso isolado)
export async function getBottleneck(): Promise<{ step_name: string; capacity_per_day: number } | null> {
  try {
    const supabase = await createClient()
    const { data: steps } = await supabase
      .from('production_steps')
      .select('step_name, time_seconds, operators')

    if (!steps?.length) return null

    const stepsWithCapacity = steps.map((s) => ({
      step_name: s.step_name,
      capacity_per_day: calculateCapacity(TOTAL_MINUTES, EFFICIENCY, s.operators, s.time_seconds / 60),
    }))

    return stepsWithCapacity.reduce((min, step) =>
      step.capacity_per_day < min.capacity_per_day ? step : min
    )
  } catch {
    return null
  }
}

// 1.3 — Criar ou atualizar etapa (upsert por sku_family + step_name)
export async function upsertProductionStep(data: ProductionStepFormData) {
  const parsed = productionStepSchema.safeParse(data)
  if (!parsed.success) throw new Error('Dados inválidos')

  const supabase = await createClient()
  const { error } = await supabase.from('production_steps').upsert(
    {
      sku_family: parsed.data.sku_family,
      step_name: parsed.data.step_name,
      time_seconds: parsed.data.time_seconds,
      operators: parsed.data.operators,
      machines: parsed.data.machines,
    },
    { onConflict: 'sku_family,step_name' }
  )

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/production')
}
