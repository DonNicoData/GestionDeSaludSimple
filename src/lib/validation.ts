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

export type BasicDataField = keyof BasicDataInput

/**
 * Valida un campo individual por nombre y devuelve la clave de error
 * (que se traduce con i18n) o null si pasa.
 */
export function validateField(
  field: BasicDataField,
  value: BasicDataInput[BasicDataField],
): string | null {
  const fieldSchema = basicDataSchema.shape[field]
  const result = fieldSchema.safeParse(value)
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'required'
}

/**
 * Schema para un campo numérico requerido.
 * Acepta string vacío como `0` y transforma a número.
 */
function requiredNumberField(min: number, max: number) {
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
    .pipe(z.number().min(min).max(max))
}

/**
 * Schema para un campo numérico opcional.
 * Acepta string vacío como `0` (interpretado como "no medido").
 * Acepta cualquier valor dentro del rango [0, max].
 */
function optionalNumberField(max: number) {
  return z
    .string()
    .transform((s, ctx) => {
      if (s.trim() === '') return 0
      const n = Number(s)
      if (Number.isNaN(n)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalidNumber' })
        return z.NEVER
      }
      return n
    })
    .pipe(z.number().min(0).max(max))
}

/**
 * Schema de las 7 métricas corporales.
 * - Campos requeridos: weight, calories, visceralFat
 * - Campos opcionales (0 = no medido): bmi, bodyFatPct, muscleMassPct, bioAge
 */
export const metricsSchema = z.object({
  weight: requiredNumberField(20, 300),
  bmi: optionalNumberField(60),
  bodyFatPct: optionalNumberField(50),
  muscleMassPct: optionalNumberField(70),
  calories: requiredNumberField(800, 6000),
  bioAge: optionalNumberField(100),
  visceralFat: requiredNumberField(1, 30),
})

export type MetricsInput = z.input<typeof metricsSchema>
export type MetricsOutput = z.output<typeof metricsSchema>

export type MetricsField = keyof MetricsInput

/**
 * Valida un campo individual de métricas.
 * Devuelve la clave de error o null si pasa.
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
