import { z } from 'zod'

const todayIso = (): string => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Schema común para los 3 campos de nombre.
 * - 2-50 caracteres
 * - Solo letras Unicode, espacios, guiones y apóstrofes
 * - Debe contener al menos una letra
 * - Colapsa espacios múltiples
 */
const nameFieldSchema = z
  .string({ required_error: 'required' })
  .transform((s) => s.replace(/\s+/g, ' ').trim())
  .pipe(
    z
      .string()
      .min(2, 'tooShort')
      .max(50, 'tooLong')
      .regex(/^[\p{L}\s'-]+$/u, 'invalidChars')
      .refine((s) => /\p{L}/u.test(s), 'needsLetters'),
  )

/**
 * Campo numérico REQUERIDO: string → transform → number.
 * - Vacío → 'required'
 * - No numérico → 'invalidNumber'
 * - Fuera de [min, max] → clave traducible pasada por parámetro
 */
function requiredNumberField(min: number, max: number, rangeErrorKey: string) {
  return z
    .string({ required_error: 'required' })
    .transform((s, ctx) => {
      if (s.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'required' })
        return z.NEVER
      }
      const n = Number(s)
      if (Number.isNaN(n)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalidNumber' })
        return z.NEVER
      }
      return n
    })
    .pipe(
      z
        .number()
        .min(min, rangeErrorKey)
        .max(max, rangeErrorKey),
    )
}

/**
 * Schema de los datos básicos del cliente.
 */
export const basicDataSchema = z.object({
  firstName: nameFieldSchema,
  lastName1: nameFieldSchema,
  lastName2: nameFieldSchema,
  birthDate: z
    .string({ required_error: 'required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'invalidDate')
    .refine((v) => v <= todayIso(), 'futureDate'),
  heightCm: requiredNumberField(100, 230, 'heightOutOfRange'),
  gender: z.enum(['F', 'M'], { required_error: 'required' }),
  wristContexture: z.enum(['thin', 'normal', 'thick'], {
    required_error: 'required',
  }),
})

export type BasicDataInput = z.input<typeof basicDataSchema>
export type BasicDataOutput = z.output<typeof basicDataSchema>

export type BasicDataField = keyof BasicDataInput

/**
 * Valida un campo individual por nombre y devuelve la clave de error
 * (que se traduce con i18n) o null si pasa.
 * Acepta `undefined` para campos opcionales no seleccionados.
 */
export function validateField(
  field: BasicDataField,
  value: BasicDataInput[BasicDataField] | undefined,
): string | null {
  const fieldSchema = basicDataSchema.shape[field]
  const result = fieldSchema.safeParse(value)
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'required'
}

/**
 * Schema de las 7 métricas corporales.
 * - Las 7 son REQUERIDAS: los valores vienen del equipo de medición del
 *   profesional (báscula inteligente, examen de composición corporal).
 *   No se acepta "no medido" en esta app.
 */
export const metricsSchema = z.object({
  weight: requiredNumberField(20, 300, 'weightOutOfRange'),
  bmi: requiredNumberField(10, 60, 'bmiOutOfRange'),
  bodyFatPct: requiredNumberField(3, 50, 'bodyFatOutOfRange'),
  muscleMassPct: requiredNumberField(10, 70, 'muscleOutOfRange'),
  calories: requiredNumberField(800, 6000, 'caloriesOutOfRange'),
  bioAge: requiredNumberField(10, 100, 'bioAgeOutOfRange'),
  visceralFat: requiredNumberField(1, 30, 'visceralOutOfRange'),
})

export type MetricsInput = z.input<typeof metricsSchema>
export type MetricsOutput = z.output<typeof metricsSchema>

export type MetricsField = keyof MetricsInput

/**
 * Valida un campo individual de métricas.
 */
export function validateMetricField(
  field: MetricsField,
  value: MetricsInput[MetricsField],
): string | null {
  const fieldSchema = metricsSchema.shape[field]
  const result = fieldSchema.safeParse(value)
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'required'
}
