'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { saleSchema, type SaleFormData } from '@/app/dashboard/sales/schema'
import { createSale } from '@/app/dashboard/sales/actions'

type SkuOption = { id: string; sku_code: string; product_name: string }

interface SaleFormDialogProps {
  skus: SkuOption[]
}

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

const CHANNELS = ['Shopee', 'Mercado Livre', 'Amazon', 'Loja Própria', 'Atacado', 'Outros']

export function SaleFormDialog({ skus }: SaleFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      fees: 0,
      freight: 0,
      tax: 0,
    },
  })

  const onSubmit = async (data: SaleFormData) => {
    await createSale(data)
    setSuccess(true)
    reset()
    setTimeout(() => {
      setSuccess(false)
      setOpen(false)
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
        Importar Venda
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Importar Venda</h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1 hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-2 py-10 text-emerald-600">
                <div className="text-4xl">✓</div>
                <p className="font-medium">Venda registrada com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Field label="SKU *" error={errors.sku_id?.message}>
                      <select className={cn(inputCls)} {...register('sku_id')}>
                        <option value="">Selecione um SKU</option>
                        {skus.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.sku_code} — {s.product_name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Data *" error={errors.date?.message}>
                    <input
                      type="date"
                      className={inputCls}
                      {...register('date')}
                    />
                  </Field>

                  <Field label="Canal *" error={errors.channel?.message}>
                    <select className={cn(inputCls)} {...register('channel')}>
                      <option value="">Selecione</option>
                      {CHANNELS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Quantidade *" error={errors.quantity?.message}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={inputCls}
                      placeholder="0"
                      {...register('quantity', { valueAsNumber: true })}
                    />
                  </Field>

                  <Field label="Preço Unitário (R$) *" error={errors.unit_price?.message}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      placeholder="0.00"
                      {...register('unit_price', { valueAsNumber: true })}
                    />
                  </Field>

                  <div className="col-span-2">
                    <Field label="Receita Bruta (R$) *" error={errors.gross_revenue?.message}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputCls}
                        placeholder="0.00"
                        {...register('gross_revenue', { valueAsNumber: true })}
                      />
                    </Field>
                  </div>

                  <Field label="Taxas (R$)" error={errors.fees?.message}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      placeholder="0.00"
                      {...register('fees', { valueAsNumber: true })}
                    />
                  </Field>

                  <Field label="Frete (R$)" error={errors.freight?.message}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      placeholder="0.00"
                      {...register('freight', { valueAsNumber: true })}
                    />
                  </Field>

                  <Field label="Impostos (R$)" error={errors.tax?.message}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      placeholder="0.00"
                      {...register('tax', { valueAsNumber: true })}
                    />
                  </Field>
                </div>

                <p className="text-xs text-muted-foreground">
                  Receita Líquida = Receita Bruta − Taxas − Frete − Impostos
                </p>

                <div className="flex items-center justify-end gap-2 pt-1 border-t">
                  <Button variant="outline" type="button" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                    Registrar
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
