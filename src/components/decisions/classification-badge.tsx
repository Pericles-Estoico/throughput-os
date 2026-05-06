import { cn } from '@/lib/utils'
import type { SKUClassification, SKUAction } from '@/types'

const classConfig: Record<
  SKUClassification,
  { badge: string; description: string }
> = {
  A: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    description: 'Alto ganho, alto giro',
  },
  B: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Ganho ou giro moderado',
  },
  C: {
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    description: 'Baixo giro, algum ganho',
  },
  D: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    description: 'Baixo ganho e baixo giro',
  },
}

const actionConfig: Record<SKUAction, string> = {
  ESCALAR: 'font-semibold text-green-700 dark:text-green-400',
  MANTER: 'font-semibold text-blue-700 dark:text-blue-400',
  REDUZIR: 'font-semibold text-yellow-700 dark:text-yellow-400',
  ELIMINAR: 'font-semibold text-red-700 dark:text-red-400',
}

export function ClassificationBadge({
  classification,
}: {
  classification: SKUClassification
}) {
  const cfg = classConfig[classification]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide',
        cfg.badge
      )}
      title={cfg.description}
    >
      {classification}
    </span>
  )
}

export function ActionLabel({ action }: { action: SKUAction }) {
  return (
    <span className={cn('text-xs uppercase tracking-wide', actionConfig[action])}>
      {action}
    </span>
  )
}
