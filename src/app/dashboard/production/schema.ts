import { z } from 'zod'

export const productionStepSchema = z.object({
  sku_family: z.string().min(1, 'Família de SKU é obrigatória'),
  step_name: z.string().min(1, 'Nome da etapa é obrigatório'),
  time_seconds: z.number().int().positive('Tempo deve ser positivo'),
  operators: z.number().int().positive('Deve ter ao menos 1 operador'),
  machines: z.number().int().positive('Deve ter ao menos 1 máquina'),
})

export type ProductionStepFormData = z.infer<typeof productionStepSchema>
