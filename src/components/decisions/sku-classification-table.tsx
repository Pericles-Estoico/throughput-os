'use client'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useState, useTransition } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ClassificationBadge, ActionLabel } from './classification-badge'
import { confirmDecision } from '@/app/dashboard/decisions/actions'
import type { SKUMetrics, SKUClassification } from '@/types'

const brl = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const FILTERS: { label: string; value: SKUClassification | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'A — Escalar', value: 'A' },
  { label: 'B — Manter', value: 'B' },
  { label: 'C — Reduzir', value: 'C' },
  { label: 'D — Eliminar', value: 'D' },
]

function ConfirmButton({ row }: { row: SKUMetrics }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handleConfirm = () => {
    startTransition(async () => {
      await confirmDecision(
        row.sku.id,
        row.action,
        row.throughput_total,
        `Classificação ${row.classification}: ${row.action}`
      )
      setDone(true)
    })
  }

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="size-3.5" />
        Confirmado
      </span>
    )
  }

  return (
    <Button size="xs" variant="outline" onClick={handleConfirm} disabled={isPending}>
      {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
      Confirmar
    </Button>
  )
}

const columnHelper = createColumnHelper<SKUMetrics>()

const columns = [
  columnHelper.accessor((row) => row.sku.sku_code, {
    id: 'sku_code',
    header: 'SKU',
    cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
  }),
  columnHelper.accessor((row) => row.sku.product_name, {
    id: 'product_name',
    header: 'Produto',
    cell: (info) => <span className="max-w-[160px] truncate block">{info.getValue()}</span>,
  }),
  columnHelper.accessor('throughput_unit', {
    header: 'Ganho Unit.',
    cell: (info) => {
      const v = info.getValue()
      return (
        <span className={cn('tabular-nums', v < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
          {brl(v)}
        </span>
      )
    },
  }),
  columnHelper.accessor('throughput_total', {
    header: 'Ganho Total (30d)',
    cell: (info) => {
      const v = info.getValue()
      return (
        <span className={cn('tabular-nums font-medium', v < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
          {brl(v)}
        </span>
      )
    },
  }),
  columnHelper.accessor('avg_daily_sales', {
    header: 'Giro/dia',
    cell: (info) => (
      <span className="tabular-nums">{info.getValue().toFixed(1)}</span>
    ),
  }),
  columnHelper.accessor('stock_total', {
    header: 'Estoque',
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  columnHelper.accessor('classification', {
    header: 'Classe',
    cell: (info) => <ClassificationBadge classification={info.getValue()} />,
  }),
  columnHelper.accessor('action', {
    header: 'Ação',
    cell: (info) => <ActionLabel action={info.getValue()} />,
  }),
  columnHelper.display({
    id: 'confirm',
    header: '',
    cell: ({ row }) => <ConfirmButton row={row.original} />,
  }),
]

interface SKUClassificationTableProps {
  data: SKUMetrics[]
}

export function SKUClassificationTable({ data }: SKUClassificationTableProps) {
  const [filter, setFilter] = useState<SKUClassification | 'all'>('all')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'throughput_total', desc: true },
  ])

  const filtered = filter === 'all' ? data : data.filter((r) => r.classification === filter)

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const count = f.value === 'all' ? data.length : data.filter((r) => r.classification === f.value).length
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                filter === f.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background hover:bg-muted'
              )}
            >
              {f.label}
              <span className={cn('ml-1.5 tabular-nums', filter === f.value ? 'opacity-70' : 'text-muted-foreground')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {data.length === 0
              ? 'Nenhum SKU ativo com dados de vendas.'
              : `Nenhum SKU classe ${filter} encontrado.`}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {header.column.getCanSort() ? (
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="size-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="size-3" />
                            ) : (
                              <ArrowUpDown className="size-3 opacity-40" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b last:border-0 hover:bg-muted/30 transition-colors',
                      row.original.classification === 'D' && 'bg-red-50/30 dark:bg-red-950/10'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/30">
            {filtered.length} {filtered.length === 1 ? 'SKU' : 'SKUs'}
            {filter !== 'all' && ` classe ${filter}`}
          </div>
        </div>
      )}
    </div>
  )
}
