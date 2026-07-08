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
      // Defensa en profundidad: aceptar coma como separador decimal aunque
      // Input.tsx ya normalice en la UI. Cubre drafts viejos guardados
      // antes del fix y futuras rutas que entreguen strings directos
      // (ej: import de datos, deep-link, etc.).
      const normalized = s.replace(',', '.')
      const n = Number(normalized)
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
 * Schema de las notas opcionales de una medición. Validamos
 * longitud máxima (500) en el momento del submit pero NO en cada
 * keystroke (el Input.tsx ya trunca a NOTES_MAX).
 */
const notesSchema = z
  .string()
  .max(500, 'notesTooLong')
  .optional()

/**
 * Schema de las 7 métricas corporales.
 * - Las 7 son REQUERIDAS: los valores vienen del equipo de medición del
 *   profesional (báscula inteligente, examen de composición corporal).
 *   No se acepta "no medido" en esta app.
 * - `notes`: opcional, máximo 500 caracteres (Fase 8).
 */
export const metricsSchema = z.object({
  weight: requiredNumberField(20, 300, 'weightOutOfRange'),
  bmi: requiredNumberField(10, 60, 'bmiOutOfRange'),
  bodyFatPct: requiredNumberField(3, 50, 'bodyFatOutOfRange'),
  muscleMassPct: requiredNumberField(10, 70, 'muscleOutOfRange'),
  calories: requiredNumberField(800, 6000, 'caloriesOutOfRange'),
  bioAge: requiredNumberField(10, 100, 'bioAgeOutOfRange'),
  visceralFat: requiredNumberField(1, 30, 'visceralOutOfRange'),
  notes: notesSchema,
})

export type MetricsInput = z.input<typeof metricsSchema>
export type MetricsOutput = z.output<typeof metricsSchema>

/**
 * Slugs estables para los 7 valores numéricos requeridos (form state
 * como strings, y acceso tipado al schema).
 *
 * `notes` NO está acá: vive en state separado porque tiene semántica
 * distinta (sessionStorage vs draft, opcional).
 */
export type MetricsField =
  | 'weight'
  | 'bmi'
  | 'bodyFatPct'
  | 'muscleMassPct'
  | 'calories'
  | 'bioAge'
  | 'visceralFat'

/**
 * Tipo del form state: los 7 valores como strings (lo que el usuario
 * tipea, antes de la transformación del schema a number).
 */
export type MetricsFormState = {
  weight: string
  bmi: string
  bodyFatPct: string
  muscleMassPct: string
  calories: string
  bioAge: string
  visceralFat: string
}

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
