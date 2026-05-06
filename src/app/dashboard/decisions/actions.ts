'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  classifySKU,
  getActionFromClassification,
  calculateStockCoverage,
  getStockStatus,
} from '@/lib/calculations'
import type { SKUMetrics } from '@/types'

export async function getSKUMetrics(): Promise<SKUMetrics[]> {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const dateFrom = thirtyDaysAgo.toISOString().split('T')[0]

  const [skusRes, salesRes, costsRes, inventoryRes] = await Promise.all([
    supabase
      .from('skus')
      .select('id, sku_code, product_name, category, family, active')
      .eq('active', true),
    supabase
      .from('sales')
      .select('sku_id, quantity, net_revenue')
      .gte('date', dateFrom),
    supabase.from('costs').select('sku_id, variable_cost_total'),
    supabase
      .from('inventory')
      .select('sku_id, stock_raw, stock_semi, stock_finished, stock_marketplace'),
  ])

  const skus = skusRes.data ?? []
  const sales = salesRes.data ?? []
  const costs = costsRes.data ?? []
  const inventory = inventoryRes.data ?? []

  const costsMap = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    costs.map((c: any) => [c.sku_id, c.variable_cost_total ?? 0])
  )
  const inventoryMap = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inventory.map((i: any) => [
      i.sku_id,
      (i.stock_raw ?? 0) + (i.stock_semi ?? 0) + (i.stock_finished ?? 0) + (i.stock_marketplace ?? 0),
    ])
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const salesAgg: Record<string, { totalQty: number; totalRevenue: number }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const sale of sales as any[]) {
    if (!salesAgg[sale.sku_id]) salesAgg[sale.sku_id] = { totalQty: 0, totalRevenue: 0 }
    salesAgg[sale.sku_id].totalQty += sale.quantity
    salesAgg[sale.sku_id].totalRevenue += sale.net_revenue
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (skus as any[]).map((sku) => {
    const agg = salesAgg[sku.id] ?? { totalQty: 0, totalRevenue: 0 }
    const variableCost = (costsMap[sku.id] as number) ?? 0
    const stockTotal = (inventoryMap[sku.id] as number) ?? 0
    const avgDailySales = agg.totalQty / 30
    const avgRevenuePerUnit = agg.totalQty > 0 ? agg.totalRevenue / agg.totalQty : 0
    const throughputUnit = avgRevenuePerUnit - variableCost
    const throughputTotal = throughputUnit * agg.totalQty
    return { sku, throughputUnit, throughputTotal, avgDailySales, stockTotal }
  })

  const allThroughputs = raw.map((m) => m.throughputUnit)
  const allTurnover = raw.map((m) => m.avgDailySales)

  return raw.map((m) => {
    const stockCoverageDays = calculateStockCoverage(m.stockTotal, m.avgDailySales)
    const stockStatus = getStockStatus(stockCoverageDays)
    const classification = classifySKU(
      m.throughputUnit,
      m.throughputTotal,
      m.avgDailySales,
      allThroughputs,
      allTurnover
    )
    const action = getActionFromClassification(classification)
    return {
      sku: m.sku,
      throughput_unit: m.throughputUnit,
      throughput_total: m.throughputTotal,
      avg_daily_sales: m.avgDailySales,
      stock_total: m.stockTotal,
      stock_coverage_days: stockCoverageDays,
      stock_status: stockStatus,
      classification,
      action,
    } satisfies SKUMetrics
  })
}

export async function confirmDecision(
  sku_id: string,
  action: string,
  expected_gain: number,
  reason: string
) {
  const supabase = await createClient()
  const { error } = await supabase.from('decisions').insert({
    sku_id,
    date: new Date().toISOString().split('T')[0],
    action,
    expected_gain,
    reason,
    status: 'pending',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/decisions')
}
