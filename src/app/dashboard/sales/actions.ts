'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { saleSchema, type SaleFormData } from './schema'

export type SaleWithMetrics = {
  id: string
  date: string
  channel: string
  quantity: number
  unit_price: number
  net_revenue: number
  sku_id: string
  sku_code: string
  product_name: string
  category: string
  variable_cost_total: number
  throughput_unit: number
  throughput_total: number
}

export type SalesFilters = {
  date_from?: string
  date_to?: string
  channel?: string
  category?: string
}

export async function getSalesWithMetrics(filters?: SalesFilters): Promise<SaleWithMetrics[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase.from('sales').select<string, any>(
    'id, date, channel, quantity, unit_price, net_revenue, sku_id, skus!inner(sku_code, product_name, category)'
  )

  if (filters?.date_from) query = query.gte('date', filters.date_from)
  if (filters?.date_to) query = query.lte('date', filters.date_to)
  if (filters?.channel) query = query.eq('channel', filters.channel)

  const { data: salesData, error: salesError } = await query
  if (salesError) throw new Error(salesError.message)
  if (!salesData?.length) return []

  const skuIds = [...new Set(salesData.map((s) => s.sku_id as string))]
  const { data: costsData } = await supabase
    .from('costs')
    .select('sku_id, variable_cost_total')
    .in('sku_id', skuIds)

  const costsMap = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (costsData ?? []).map((c: any) => [c.sku_id, c.variable_cost_total ?? 0])
  )

  const results: SaleWithMetrics[] = salesData.map((row) => {
    const variableCost = (costsMap[row.sku_id] as number) ?? 0
    const throughputUnit = row.net_revenue - variableCost
    return {
      id: row.id,
      date: row.date,
      channel: row.channel,
      quantity: row.quantity,
      unit_price: row.unit_price,
      net_revenue: row.net_revenue,
      sku_id: row.sku_id,
      sku_code: row.skus.sku_code,
      product_name: row.skus.product_name,
      category: row.skus.category,
      variable_cost_total: variableCost,
      throughput_unit: throughputUnit,
      throughput_total: throughputUnit * row.quantity,
    }
  })

  const filtered = filters?.category
    ? results.filter((r) => r.category === filters.category)
    : results

  return filtered.sort((a, b) => b.throughput_total - a.throughput_total)
}

export async function createSale(data: SaleFormData) {
  const parsed = saleSchema.safeParse(data)
  if (!parsed.success) throw new Error('Dados inválidos')

  const supabase = await createClient()
  const { error } = await supabase.from('sales').insert({
    sku_id: parsed.data.sku_id,
    date: parsed.data.date,
    channel: parsed.data.channel,
    quantity: parsed.data.quantity,
    unit_price: parsed.data.unit_price,
    gross_revenue: parsed.data.gross_revenue,
    fees: parsed.data.fees,
    freight: parsed.data.freight,
    tax: parsed.data.tax,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sales')
}

export async function getSkusForSelect() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('skus')
    .select('id, sku_code, product_name')
    .eq('active', true)
    .order('sku_code')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getFilterOptions() {
  const supabase = await createClient()
  const [channelsRes, categoriesRes] = await Promise.all([
    supabase.from('sales').select('channel'),
    supabase.from('skus').select('category').eq('active', true),
  ])
  const channels = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...new Set((channelsRes.data ?? []).map((d: any) => d.channel).filter(Boolean)),
  ] as string[]
  const categories = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...new Set((categoriesRes.data ?? []).map((d: any) => d.category).filter(Boolean)),
  ] as string[]
  return { channels, categories }
}
