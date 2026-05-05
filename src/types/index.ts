export type SKUClassification = 'A' | 'B' | 'C' | 'D'
export type SKUAction = 'ESCALAR' | 'MANTER' | 'REDUZIR' | 'ELIMINAR'
export type StockStatus = 'ruptura' | 'saudavel' | 'excesso'
export type AlertType = 'ruptura' | 'produto_ruim' | 'gargalo' | 'excesso' | 'sem_margem'
export type DecisionStatus = 'pending' | 'executed' | 'cancelled'

export interface SKU {
  id: string
  sku_code: string
  product_name: string
  category: string
  family: string
  active: boolean
}

export interface Sale {
  id: string
  sku_id: string
  date: string
  channel: string
  quantity: number
  unit_price: number
  gross_revenue: number
  fees: number
  freight: number
  tax: number
  net_revenue: number
}

export interface Cost {
  id: string
  sku_id: string
  material_cost: number
  packaging_cost: number
  variable_cost_total: number
}

export interface Inventory {
  id: string
  sku_id: string
  stock_raw: number
  stock_semi: number
  stock_finished: number
  stock_marketplace: number
}

export interface ProductionStep {
  id: string
  sku_family: string
  step_name: string
  time_seconds: number
  operators: number
  machines: number
}

export interface Decision {
  id: string
  date: string
  action: string
  sku_id: string
  expected_gain: number
  reason: string
  status: DecisionStatus
}

export interface SKUMetrics {
  sku: SKU
  throughput_unit: number
  throughput_total: number
  avg_daily_sales: number
  stock_total: number
  stock_coverage_days: number
  stock_status: StockStatus
  classification: SKUClassification
  action: SKUAction
}

export interface ProductionConstraint {
  step_name: string
  capacity_per_day: number
  is_bottleneck: boolean
}

export interface DailyAlert {
  type: AlertType
  sku_id?: string
  sku_name?: string
  message: string
  priority: 'critical' | 'warning' | 'info'
}
