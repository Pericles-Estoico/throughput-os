import { z } from 'zod'

export const saleSchema = z.object({
  sku_id: z.string().min(1, 'SKU é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  channel: z.string().min(1, 'Canal é obrigatório'),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unit_price: z.number().positive('Preço unitário deve ser positivo'),
  gross_revenue: z.number().nonnegative('Receita bruta inválida'),
  fees: z.number().nonnegative('Taxas inválidas'),
  freight: z.number().nonnegative('Frete inválido'),
  tax: z.number().nonnegative('Imposto inválido'),
})

export type SaleFormData = z.infer<typeof saleSchema>
