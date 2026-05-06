'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { X } from 'lucide-react'

interface SalesFiltersProps {
  channels: string[]
  categories: string[]
}

export function SalesFilters({ channels, categories }: SalesFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const clearAll = () => router.push(pathname)

  const hasFilters =
    searchParams.has('date_from') ||
    searchParams.has('date_to') ||
    searchParams.has('channel') ||
    searchParams.has('category')

  const selectCls =
    'rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20'

  const inputCls =
    'rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 w-[140px]'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium shrink-0">Filtros:</span>

      <input
        type="date"
        className={inputCls}
        value={searchParams.get('date_from') ?? ''}
        onChange={(e) => updateParam('date_from', e.target.value)}
        placeholder="De"
      />

      <span className="text-muted-foreground text-xs">até</span>

      <input
        type="date"
        className={inputCls}
        value={searchParams.get('date_to') ?? ''}
        onChange={(e) => updateParam('date_to', e.target.value)}
        placeholder="Até"
      />

      <select
        className={selectCls}
        value={searchParams.get('channel') ?? ''}
        onChange={(e) => updateParam('channel', e.target.value)}
      >
        <option value="">Todos os canais</option>
        {channels.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        className={selectCls}
        value={searchParams.get('category') ?? ''}
        onChange={(e) => updateParam('category', e.target.value)}
      >
        <option value="">Todas as categorias</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3" />
          Limpar
        </button>
      )}
    </div>
  )
}
