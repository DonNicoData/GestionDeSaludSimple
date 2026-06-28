export type Gender = 'F' | 'M'

export type WristContexture = 'thin' | 'normal' | 'thick'

export type MetricStatus = 'normal' | 'warning' | 'alert'

export type Language = 'es' | 'en'

export interface Client {
  id?: number
  firstName: string
  lastName1: string
  lastName2: string
  normalizedName: string
  birthDate: string
  age: number
  gender: Gender
  heightCm: number
  wristContexture: WristContexture
  createdAt: Date
}

export interface Record {
  id?: number
  clientId: number
  date: Date
  weight: number
  bmi: number
  bodyFatPct: number
  muscleMassPct: number
  calories: number
  bioAge: number
  visceralFat: number
  notes?: string
}

/**
 * Slugs estables para cada métrica. Se usan en i18n (results.metrics.*)
 * y como `key` en la UI para mapear sin depender de literales traducidos.
 */
export type MetricKey =
  | 'weight'
  | 'bmi'
  | 'bodyFatPct'
  | 'muscleMassPct'
  | 'calories'
  | 'bioAge'
  | 'visceralFat'

/**
 * Resultado de evaluar una métrica individual contra los rangos médicos.
 * Las 7 métricas son siempre requeridas (los valores vienen del equipo
 * de medición), por lo que `value` nunca es null.
 *
 * - `status='normal'|'warning'|'alert'`: pintado con el color
 *   correspondiente en la UI.
 * - `idealRange`: rango saludable como texto (ej. "18.5 – 24.9") que se
 *   muestra como referencia informativa en la tarjeta.
 * - `contexture`: solo presente en la métrica `weight` (es la única que
 *   usa Lorentz × factor de contextura). Permite a la UI mostrar la
 *   línea de metodología sin tener que recibir el cliente completo.
 */
export interface MetricEvaluation {
  key: MetricKey
  value: number
  status: MetricStatus
  idealRange: string | null
  messageKey: string
  contexture?: WristContexture
}