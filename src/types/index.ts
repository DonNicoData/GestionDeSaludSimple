export type Gender = 'F' | 'M'

export type WristContexture = 'thin' | 'normal' | 'thick'

export type MetricStatus = 'normal' | 'warning' | 'alert'

export type Language = 'es' | 'en'

export interface Client {
  id?: number
  firstName: string
  lastName1: string
  lastName2: string
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
 * - `provided=false`: el usuario no la midió (campo opcional). La UI la
 *   muestra como "no medida" pero no se incluye en el semáforo.
 * - `provided=true` con `status='normal'|'warning'|'alert'`: pintado con
 *   el color correspondiente en la UI.
 * - `idealRange`: rango saludable expresado como texto i18n-friendly
 *   (ej. "18.5 – 24.9") cuando aplica. Útil para tooltips.
 */
export interface MetricEvaluation {
  key: MetricKey
  provided: boolean
  value: number | null
  status: MetricStatus
  idealRange: string | null
  messageKey: string
}