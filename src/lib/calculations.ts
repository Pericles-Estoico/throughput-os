import type { SKUClassification, SKUAction, StockStatus } from '@/types'

export function calculateThroughput(netRevenue: number, variableCostTotal: number): number {
  return netRevenue - variableCostTotal
}

export function calculateTotalThroughput(throughputUnit: number, quantity: number): number {
  return throughputUnit * quantity
}

export function calculateInventoryValue(stockUnits: number, unitCost: number): number {
  return stockUnits * unitCost
}

export function calculateCapacity(
  totalMinutes: number,
  efficiency: number,
  operators: number,
  timePerPieceMinutes: number
): number {
  if (timePerPieceMinutes === 0) return 0
  return (totalMinutes * efficiency * operators) / timePerPieceMinutes
}

export function identifyConstraint(
  steps: { step_name: string; capacity_per_day: number }[]
): string {
  if (steps.length === 0) return ''
  return steps.reduce((min, step) =>
    step.capacity_per_day < min.capacity_per_day ? step : min
  ).step_name
}

export function calculateStockCoverage(stock: number, avgDailySales: number): number {
  if (avgDailySales === 0) return 999
  return stock / avgDailySales
}

export function getStockStatus(coverageDays: number): StockStatus {
  if (coverageDays < 3) return 'ruptura'
  if (coverageDays > 15) return 'excesso'
  return 'saudavel'
}

export function classifySKU(
  throughputUnit: number,
  throughputTotal: number,
  avgDailySales: number,
  allThroughputs: number[],
  allTurnover: number[]
): SKUClassification {
  if (allThroughputs.length === 0) return 'D'

  const maxT = Math.max(...allThroughputs)
  const maxTurnover = Math.max(...allTurnover)

  const tRatio = maxT > 0 ? throughputUnit / maxT : 0
  const turnoverRatio = maxTurnover > 0 ? avgDailySales / maxTurnover : 0

  if (tRatio >= 0.6 && turnoverRatio >= 0.6) return 'A'
  if (tRatio >= 0.3 || turnoverRatio >= 0.3) return 'B'
  if (turnoverRatio < 0.3 && tRatio >= 0.3) return 'C'
  return 'D'
}

export function getActionFromClassification(classification: SKUClassification): SKUAction {
  const map: Record<SKUClassification, SKUAction> = {
    A: 'ESCALAR',
    B: 'MANTER',
    C: 'REDUZIR',
    D: 'ELIMINAR',
  }
  return map[classification]
}
