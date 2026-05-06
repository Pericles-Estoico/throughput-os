'use server'

import { createClient } from '@/lib/supabase/server'
import { classifySKU, calculateStockCoverage, identifyConstraint } from '@/lib/calculations'
import type { DailyAlert } from '@/types'

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getThirtyDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}

const WORK_SECONDS_PER_DAY = 8 * 3600

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawSale = { sku_id: string; net_revenue: any; quantity: number }
type SkuAgg = { throughputTotal: number; quantity: number }

function buildSkuAgg(sales: RawSale[], costsMap: Record<string, number>): Record<string, SkuAgg> {
  const agg: Record<string, SkuAgg> = {}
  for (const s of sales) {
    const variableCost = costsMap[s.sku_id] ?? 0
    const tUnit = Number(s.net_revenue) - variableCost
    if (!agg[s.sku_id]) agg[s.sku_id] = { throughputTotal: 0, quantity: 0 }
    agg[s.sku_id].throughputTotal += tUnit * s.quantity
    agg[s.sku_id].quantity += s.quantity
  }
  return agg
}

function buildClassificationMap(
  agg: Record<string, SkuAgg>,
  days: number
): Map<string, string> {
  const ids = Object.keys(agg)
  const allAvgT = ids.map((id) => agg[id].throughputTotal / (agg[id].quantity || 1))
  const allAvgSales = ids.map((id) => agg[id].quantity / days)
  const result = new Map<string, string>()
  ids.forEach((id, idx) => {
    const cls = classifySKU(
      allAvgT[idx],
      agg[id].throughputTotal,
      allAvgSales[idx],
      allAvgT,
      allAvgSales
    )
    result.set(id, cls)
  })
  return result
}

// 1.1 — Soma throughput do dia atual
export async function getDailyThroughput(): Promise<number> {
  try {
    const supabase = await createClient()
    const today = getToday()

    const { data: sales } = await supabase
      .from('sales')
      .select('sku_id, net_revenue, quantity')
      .eq('date', today)

    if (!sales?.length) return 0

    const skuIds = [...new Set(sales.map((s) => s.sku_id))]
    const { data: costs } = await supabase
      .from('costs')
      .select('sku_id, variable_cost_total')
      .in('sku_id', skuIds)

    const costsMap = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (costs ?? []).map((c: any) => [c.sku_id, Number(c.variable_cost_total)])
    )

    return sales.reduce((sum, s) => {
      const throughputUnit = Number(s.net_revenue) - (costsMap[s.sku_id] ?? 0)
      return sum + throughputUnit * s.quantity
    }, 0)
  } catch {
    return 0
  }
}

// 1.2 — Contagem SKUs classe A com venda hoje
export async function getSkusASoldToday(): Promise<number> {
  try {
    const supabase = await createClient()
    const today = getToday()
    const thirtyDaysAgo = getThirtyDaysAgo()

    const { data: todaySales } = await supabase
      .from('sales')
      .select('sku_id')
      .eq('date', today)

    if (!todaySales?.length) return 0

    const todaySkuIds = new Set(todaySales.map((s) => s.sku_id))

    const [{ data: sales30 }, { data: costs }] = await Promise.all([
      supabase
        .from('sales')
        .select('sku_id, net_revenue, quantity')
        .gte('date', thirtyDaysAgo)
        .lte('date', today),
      supabase.from('costs').select('sku_id, variable_cost_total'),
    ])

    if (!sales30?.length) return 0

    const costsMap = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (costs ?? []).map((c: any) => [c.sku_id, Number(c.variable_cost_total)])
    )
    const agg = buildSkuAgg(sales30, costsMap)
    const classMap = buildClassificationMap(agg, 30)

    let count = 0
    for (const [skuId, cls] of classMap) {
      if (cls === 'A' && todaySkuIds.has(skuId)) count++
    }
    return count
  } catch {
    return 0
  }
}

// 1.3 — SKUs com cobertura < 3 dias
export async function getSkusInRupture(): Promise<number> {
  try {
    const supabase = await createClient()
    const today = getToday()
    const thirtyDaysAgo = getThirtyDaysAgo()

    const { data: inventory } = await supabase
      .from('inventory')
      .select('sku_id, stock_finished, stock_marketplace')

    if (!inventory?.length) return 0

    const skuIds = inventory.map((i) => i.sku_id)
    const { data: sales30 } = await supabase
      .from('sales')
      .select('sku_id, quantity')
      .gte('date', thirtyDaysAgo)
      .lte('date', today)
      .in('sku_id', skuIds)

    const DAYS = 30
    const salesBySkuId: Record<string, number> = {}
    for (const s of sales30 ?? []) {
      salesBySkuId[s.sku_id] = (salesBySkuId[s.sku_id] ?? 0) + s.quantity
    }

    return inventory.filter((inv) => {
      const stock = inv.stock_finished + inv.stock_marketplace
      const avgDailySales = (salesBySkuId[inv.sku_id] ?? 0) / DAYS
      return calculateStockCoverage(stock, avgDailySales) < 3
    }).length
  } catch {
    return 0
  }
}

// 1.4 — Etapa com menor capacidade em production_steps
export async function getCurrentBottleneck(): Promise<string> {
  try {
    const supabase = await createClient()

    const { data: steps } = await supabase
      .from('production_steps')
      .select('step_name, time_seconds, operators, machines')

    if (!steps?.length) return '—'

    const stepsWithCapacity = steps.map((s) => ({
      step_name: s.step_name,
      capacity_per_day: (s.operators * s.machines * WORK_SECONDS_PER_DAY) / s.time_seconds,
    }))

    return identifyConstraint(stepsWithCapacity) || '—'
  } catch {
    return '—'
  }
}

// 1.5 — Lista de alertas automáticos, ordenada por prioridade
export async function getDailyAlerts(): Promise<DailyAlert[]> {
  try {
    const supabase = await createClient()
    const today = getToday()
    const thirtyDaysAgo = getThirtyDaysAgo()

    const [
      { data: sales30 },
      { data: salesToday },
      { data: inventory },
      { data: costs },
      { data: steps },
      { data: skus },
    ] = await Promise.all([
      supabase
        .from('sales')
        .select('sku_id, net_revenue, quantity')
        .gte('date', thirtyDaysAgo)
        .lte('date', today),
      supabase.from('sales').select('sku_id, net_revenue, quantity').eq('date', today),
      supabase.from('inventory').select('sku_id, stock_finished, stock_marketplace'),
      supabase.from('costs').select('sku_id, variable_cost_total'),
      supabase.from('production_steps').select('sku_family, step_name, time_seconds, operators, machines'),
      supabase.from('skus').select('id, sku_code, product_name, family').eq('active', true),
    ])

    const alerts: DailyAlert[] = []

    const costsMap = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (costs ?? []).map((c: any) => [c.sku_id, Number(c.variable_cost_total)])
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const skuMap = Object.fromEntries((skus ?? []).map((s: any) => [s.id, s]))

    // Classificação de todos os SKUs (30 dias)
    const DAYS = 30
    const agg = buildSkuAgg(sales30 ?? [], costsMap)
    const classMap = buildClassificationMap(agg, DAYS)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invMap = Object.fromEntries((inventory ?? []).map((i: any) => [i.sku_id, i]))

    // 2.1 — Ruptura: SKU A com cobertura < 3 dias → critical
    for (const [skuId, cls] of classMap) {
      if (cls !== 'A') continue
      const inv = invMap[skuId]
      if (!inv) continue
      const stock = inv.stock_finished + inv.stock_marketplace
      const avgDailySales = (agg[skuId]?.quantity ?? 0) / DAYS
      const coverage = calculateStockCoverage(stock, avgDailySales)
      if (coverage < 3) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sku = skuMap[skuId] as any
        alerts.push({
          type: 'ruptura',
          sku_id: skuId,
          sku_name: sku?.product_name,
          message: `Ruptura: ${sku?.product_name ?? sku?.sku_code ?? skuId} — ${coverage.toFixed(1)} dias de cobertura`,
          priority: 'critical',
        })
      }
    }

    // 2.2 — Produto D consumindo produção: SKU D com stock_finished > 0 → warning
    for (const [skuId, cls] of classMap) {
      if (cls !== 'D') continue
      const inv = invMap[skuId]
      if (!inv || inv.stock_finished <= 0) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sku = skuMap[skuId] as any
      alerts.push({
        type: 'produto_ruim',
        sku_id: skuId,
        sku_name: sku?.product_name,
        message: `Produto D em produção: ${sku?.product_name ?? sku?.sku_code ?? skuId} — eliminar ou liquidar`,
        priority: 'warning',
      })
    }

    // 2.3 — Estoque excessivo: cobertura > 20 dias → warning
    for (const [skuId, inv] of Object.entries(invMap)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const i = inv as any
      const stock = i.stock_finished + i.stock_marketplace
      const avgDailySales = (agg[skuId]?.quantity ?? 0) / DAYS
      if (avgDailySales === 0) continue
      const coverage = calculateStockCoverage(stock, avgDailySales)
      if (coverage > 20) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sku = skuMap[skuId] as any
        alerts.push({
          type: 'excesso',
          sku_id: skuId,
          sku_name: sku?.product_name,
          message: `Estoque excessivo: ${sku?.product_name ?? sku?.sku_code ?? skuId} — ${Math.round(coverage)} dias de cobertura`,
          priority: 'warning',
        })
      }
    }

    // 2.4 — Venda sem margem: net_revenue < variable_cost_total → critical
    const reportedSemMargem = new Set<string>()
    for (const s of salesToday ?? []) {
      if (reportedSemMargem.has(s.sku_id)) continue
      const variableCost = costsMap[s.sku_id] ?? 0
      const throughputUnit = Number(s.net_revenue) - variableCost
      if (throughputUnit < 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sku = skuMap[s.sku_id] as any
        alerts.push({
          type: 'sem_margem',
          sku_id: s.sku_id,
          sku_name: sku?.product_name,
          message: `Venda sem margem: ${sku?.product_name ?? sku?.sku_code ?? s.sku_id} — throughput negativo hoje`,
          priority: 'critical',
        })
        reportedSemMargem.add(s.sku_id)
      }
    }

    // 2.5 — Gargalo parado: sem vendas hoje para família do gargalo → warning
    if (steps?.length) {
      const stepsWithCapacity = steps.map((s) => ({
        step_name: s.step_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sku_family: (s as any).sku_family as string,
        capacity_per_day: (s.operators * s.machines * WORK_SECONDS_PER_DAY) / s.time_seconds,
      }))

      const bottleneck = stepsWithCapacity.reduce((min, step) =>
        step.capacity_per_day < min.capacity_per_day ? step : min
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const skusInFamily = (skus ?? []).filter((s: any) => s.family === bottleneck.sku_family).map((s: any) => s.id as string)
      const soldToday = new Set((salesToday ?? []).map((s) => s.sku_id))
      const familySoldToday = skusInFamily.some((id) => soldToday.has(id))

      if (skusInFamily.length > 0 && !familySoldToday) {
        alerts.push({
          type: 'gargalo',
          message: `Gargalo parado: ${bottleneck.step_name} (família ${bottleneck.sku_family}) — nenhuma venda hoje`,
          priority: 'warning',
        })
      }
    }

    // Ordena: critical primeiro, depois warning, depois info
    const priorityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }
    return alerts.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2))
  } catch {
    return []
  }
}
