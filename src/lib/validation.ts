import { z } from 'zod'

/**
 * Normaliza un nombre: lowercase, trim, sin tildes, espacios colapsados.
 */
export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

const todayIso = (): string => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Schema de los datos básicos del cliente (datos de identidad).
 * Usado en el formulario de Fase 2.
 */
export const basicDataSchema = z.object({
  name: z
    .string({ required_error: 'required' })
    .trim()
    .min(2, 'nameMin')
    .max(100, 'nameMax'),
  birthDate: z
    .string({ required_error: 'required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'invalidDate')
    .refine((v) => v <= todayIso(), 'futureDate'),
  heightCm: z
    .number({ required_error: 'required', invalid_type_error: 'required' })
    .int('heightOutOfRange')
    .min(100, 'heightOutOfRange')
    .max(230, 'heightOutOfRange'),
  gender: z.enum(['F', 'M'], { required_error: 'required' }),
  wristContexture: z.enum(['thin', 'normal', 'thick'], {
    required_error: 'required',
  }),
})

export type BasicDataInput = z.input<typeof basicDataSchema>
export type BasicDataOutput = z.output<typeof basicDataSchema>

/**
 * Valida un campo individual por nombre y devuelve la clave de error
 * (que se traduce con i18n) o null si pasa.
 */
export function validateField<K extends keyof BasicDataInput>(
  field: K,
  value: BasicDataInput[K],
): string | null {
  const fieldSchema = basicDataSchema.shape[field]
  const result = fieldSchema.safeParse(value)
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'required'
}
