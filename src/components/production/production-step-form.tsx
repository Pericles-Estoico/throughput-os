'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { productionStepSchema, type ProductionStepFormData } from '@/app/dashboard/production/schema'
import { upsertProductionStep } from '@/app/dashboard/production/actions'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50'

export function ProductionStepForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductionStepFormData>({
    resolver: zodResolver(productionStepSchema),
    defaultValues: { operators: 1, machines: 1 },
  })

  const onSubmit = async (data: ProductionStepFormData) => {
    await upsertProductionStep(data)
    setSuccess(true)
    reset()
    setTimeout(() => {
      setSuccess(false)
      setOpen(false)
      router.refresh()
    }, 1500)
  }

  const handleClose = () => {
    reset()
    setSuccess(false)
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Adicionar Etapa
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Cadastrar Etapa de Produção</h2>
              <button onClick={handleClose} className="rounded-md p-1 hover:bg-muted transition-colors">
                <X className="size-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-2 py-10 text-emerald-600">
                <div className="text-4xl">✓</div>
                <p className="font-medium">Etapa salva com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Field label="Família de SKU *" error={errors.sku_family?.message}>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Ex: Camiseta, Calça, Tênis"
                        {...register('sku_family')}
                      />
                    </Field>
                  </div>

                  <div className="col-span-2">
                    <Field label="Nome da Etapa *" error={errors.step_name?.message}>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Ex: Corte, Costura, Acabamento"
                        {...register('step_name')}
                      />
                    </Field>
                  </div>

                  <div className="col-span-2">
                    <Field label="Tempo por unidade (segundos) *" error={errors.time_seconds?.message}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className={inputCls}
                        placeholder="Ex: 120"
                        {...register('time_seconds', { valueAsNumber: true })}
                      />
                    </Field>
                  </div>

                  <Field label="Operadores *" error={errors.operators?.message}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={inputCls}
                      {...register('operators', { valueAsNumber: true })}
                    />
                  </Field>

                  <Field label="Máquinas *" error={errors.machines?.message}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={inputCls}
                      {...register('machines', { valueAsNumber: true })}
                    />
                  </Field>
                </div>

                <p className={cn('text-xs text-muted-foreground')}>
                  Mesma família + etapa sobrescreve o registro existente.
                </p>

                <div className="flex items-center justify-end gap-2 border-t pt-3">
                  <Button variant="outline" type="button" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
