'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateStockCoverage, getStockStatus } from '@/lib/calculations'
import type { StockStatus } from '@/types'

export type InventoryRow = {
  sku_id: string
  sku_code: string
  product_name: string
  stock_total: number
  avg_daily_sales: number
  coverage_days: number
  status: StockStatus
}

export async function getInventoryData(): Promise<InventoryRow[]> {
  try {
    const supabase = await createClient()

    const today = new Date().toISOString().split('T')[0]
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const thirtyDaysAgo = d.toISOString().split('T')[0]

    const [{ data: inventory }, { data: sales30 }, { data: skus }] = await Promise.all([
      supabase
        .from('inventory')
        .select('sku_id, stock_raw, stock_semi, stock_finished, stock_marketplace'),
      supabase
        .from('sales')
        .select('sku_id, quantity')
        .gte('date', thirtyDaysAgo)
        .lte('date', today),
      supabase.from('skus').select('id, sku_code, product_name').eq('active', true),
    ])

    if (!inventory?.length) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const skuMap = Object.fromEntries((skus ?? []).map((s: any) => [s.id, s]))

    const DAYS = 30
    const salesBySkuId: Record<string, number> = {}
    for (const s of sales30 ?? []) {
      salesBySkuId[s.sku_id] = (salesBySkuId[s.sku_id] ?? 0) + s.quantity
    }

    const rows: InventoryRow[] = inventory.map((inv) => {
      const stock_total =
        inv.stock_raw + inv.stock_semi + inv.stock_finished + inv.stock_marketplace
      const avg_daily_sales = (salesBySkuId[inv.sku_id] ?? 0) / DAYS
      const coverage_days = calculateStockCoverage(stock_total, avg_daily_sales)
      const status = getStockStatus(coverage_days)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sku = skuMap[inv.sku_id] as any

      return {
        sku_id: inv.sku_id,
        sku_code: sku?.sku_code ?? '—',
        product_name: sku?.product_name ?? '—',
        stock_total,
        avg_daily_sales,
        coverage_days,
        status,
      }
    })

    return rows.sort((a, b) => a.coverage_days - b.coverage_days)
  } catch {
    return []
  }
}
