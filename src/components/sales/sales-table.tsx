'use client'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SaleWithMetrics } from '@/app/dashboard/sales/actions'

const brl = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const columnHelper = createColumnHelper<SaleWithMetrics>()

const columns = [
  columnHelper.accessor('sku_code', {
    header: 'SKU',
    cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
  }),
  columnHelper.accessor('product_name', {
    header: 'Produto',
    cell: (info) => <span className="max-w-[180px] truncate block">{info.getValue()}</span>,
  }),
  columnHelper.accessor('channel', {
    header: 'Canal',
    cell: (info) => (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('quantity', {
    header: 'Qtd',
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  columnHelper.accessor('unit_price', {
    header: 'Preço Unit.',
    cell: (info) => <span className="tabular-nums">{brl(info.getValue())}</span>,
  }),
  columnHelper.accessor('net_revenue', {
    header: 'Receita Líq.',
    cell: (info) => <span className="tabular-nums">{brl(info.getValue())}</span>,
  }),
  columnHelper.accessor('throughput_unit', {
    header: 'Ganho Unit.',
    cell: (info) => {
      const v = info.getValue()
      return (
        <span className={cn('tabular-nums font-medium', v < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
          {brl(v)}
        </span>
      )
    },
  }),
  columnHelper.accessor('throughput_total', {
    header: 'Ganho Total',
    cell: (info) => {
      const v = info.getValue()
      return (
        <span className={cn('tabular-nums font-semibold', v < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
          {brl(v)}
        </span>
      )
    },
  }),
]

interface SalesTableProps {
  data: SaleWithMetrics[]
}

export function SalesTable({ data }: SalesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'throughput_total', desc: true },
  ])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!data.length) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Nenhuma venda registrada.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Clique em &ldquo;Importar Venda&rdquo; para adicionar a primeira.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
                className="border-b last:border-0 hover:bg-muted/30 transition-colors"
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
        {data.length} {data.length === 1 ? 'registro' : 'registros'}
      </div>
    </div>
  )
}
