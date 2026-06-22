import type {
  Client,
  Gender,
  MetricEvaluation,
  MetricKey,
  MetricStatus,
} from '@/types'

/**
 * Evaluador de métricas contra rangos médicos estándar.
 *
 * Funciones PURAS, sin React, sin i18n ni DOM. Devuelven un `MetricEvaluation`
 * por métrica con el estado (`normal` | `warning` | `alert`) y metadatos
 * (rango ideal formateado, clave de mensaje i18n) para que la UI los pinte.
 *
 * Fuentes (PLAN.md §6):
 * - IMC: OMS (universal)
 * - % Grasa y % Músculo: American Council on Exercise (rangos por edad × género)
 * - Grasa visceral: rangos universales de bioimpedancia
 * - Edad biológica: comparación con edad cronológica ±5 años
 * - Peso ideal: Lorentz ajustado por contextura de muñeca
 * - Calorías: Mifflin-St Jeor (TMB) ±300 kcal
 */

type AgeBracket = '20-29' | '30-39' | '40-49' | '50-59' | '60+'

/**
 * Mapea una edad (años) a uno de los 5 brackets etarios definidos en PLAN §6.
 * Edades menores a 20 caen en el bracket `20-29` (no se usan en producción
 * porque la validación limita a 10–120, pero el comportamiento queda definido).
 */
function ageBracket(age: number): AgeBracket {
  if (age < 30) return '20-29'
  if (age < 40) return '30-39'
  if (age < 50) return '40-49'
  if (age < 60) return '50-59'
  return '60+'
}

/**
 * Tabla de % grasa corporal por edad × género (PLAN §6.2 y §6.3).
 * - lower: límite inferior del rango "saludable"
 * - upper: límite superior del rango "saludable"
 * - acceptableUpper: hasta aquí es "aceptable" (warning)
 * - alertLower: desde aquí es "alta" (alert)
 *
 * Ejemplo hombre 20–29: 7-17% normal, 18-24% aceptable, ≥25% alta.
 */
const BODY_FAT_TABLE: Record<Gender, Record<AgeBracket, {
  lower: number
  upper: number
  acceptableUpper: number
  alertLower: number
}>> = {
  M: {
    '20-29': { lower: 7, upper: 17, acceptableUpper: 24, alertLower: 25 },
    '30-39': { lower: 12, upper: 21, acceptableUpper: 27, alertLower: 28 },
    '40-49': { lower: 14, upper: 23, acceptableUpper: 29, alertLower: 30 },
    '50-59': { lower: 16, upper: 24, acceptableUpper: 30, alertLower: 31 },
    '60+': { lower: 17, upper: 25, acceptableUpper: 31, alertLower: 32 },
  },
  F: {
    '20-29': { lower: 16, upper: 24, acceptableUpper: 30, alertLower: 31 },
    '30-39': { lower: 17, upper: 25, acceptableUpper: 32, alertLower: 33 },
    '40-49': { lower: 19, upper: 28, acceptableUpper: 34, alertLower: 35 },
    '50-59': { lower: 22, upper: 30, acceptableUpper: 36, alertLower: 37 },
    '60+': { lower: 22, upper: 31, acceptableUpper: 37, alertLower: 38 },
  },
}

/**
 * Tabla de % masa muscular por edad × género (PLAN §6.4 y §6.5).
 * Solo se flaggea el lado bajo (< lower → warning). El límite superior
 * del rango "normal" se incluye como referencia informativa pero no se
 * penaliza (masa muscular alta no es clínicamente problemático).
 */
const MUSCLE_TABLE: Record<Gender, Record<AgeBracket, {
  lower: number
  upper: number
}>> = {
  M: {
    '20-29': { lower: 41, upper: 52 },
    '30-39': { lower: 40, upper: 50 },
    '40-49': { lower: 38, upper: 48 },
    '50-59': { lower: 36, upper: 46 },
    '60+': { lower: 34, upper: 44 },
  },
  F: {
    '20-29': { lower: 32, upper: 39 },
    '30-39': { lower: 31, upper: 38 },
    '40-49': { lower: 29, upper: 37 },
    '50-59': { lower: 28, upper: 35 },
    '60+': { lower: 27, upper: 34 },
  },
}

/**
 * Calcula el peso ideal con la fórmula de Lorentz ajustada por contextura
 * de muñeca (PLAN §6.8).
 *  - Hombres: (altura - 100 - ((altura - 150) / 4)) × factor
 *  - Mujeres: (altura - 100 - ((altura - 150) / 2.5)) × factor
 *  - Factor: thin 0.95 | normal 1.00 | thick 1.05
 */
export function idealWeightKg(client: Client): number {
  const { heightCm, gender, wristContexture } = client
  const base =
    gender === 'M'
      ? heightCm - 100 - (heightCm - 150) / 4
      : heightCm - 100 - (heightCm - 150) / 2.5
  const factor =
    wristContexture === 'thin'
      ? 0.95
      : wristContexture === 'thick'
        ? 1.05
        : 1.0
  return base * factor
}

/**
 * Calcula la Tasa Metabólica Basal (Mifflin-St Jeor, PLAN §6.9).
 *  - Hombres:  (10·peso) + (6.25·altura) - (5·edad) + 5
 *  - Mujeres:  (10·peso) + (6.25·altura) - (5·edad) - 161
 */
export function basalMetabolicRate(client: Client, weightKg: number): number {
  const { heightCm, age, gender } = client
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return gender === 'M' ? base + 5 : base - 161
}

/**
 * Calcula el IMC (peso / altura²). Devuelve 0 si no se puede calcular.
 */
export function calculateBmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

/**
 * Devuelve el IMC efectivo del registro: el provisto por el usuario, o
 * el calculado a partir de peso y altura si quedó en 0.
 */
function effectiveBmi(
  record: { bmi: number; weight: number },
  client: { heightCm: number },
): number {
  if (record.bmi > 0) return record.bmi
  return calculateBmi(record.weight, client.heightCm)
}

/**
 * Marca el IMC contra los rangos OMS (PLAN §6.1).
 *  - < 18.5  → warning (bajo peso)
 *  - 18.5-24.9 → normal
 *  - 25-29.9 → warning (sobrepeso)
 *  - ≥ 30    → alert (obesidad)
 */
function evaluateBmi(value: number): MetricStatus {
  if (value < 18.5) return 'warning'
  if (value <= 24.9) return 'normal'
  if (value <= 29.9) return 'warning'
  return 'alert'
}

/**
 * Marca % grasa contra la tabla por edad × género (PLAN §6.2/§6.3).
 *  - < lower → warning (demasiado bajo)
 *  - lower..upper → normal
 *  - upper..acceptableUpper → warning (aceptable)
 *  - ≥ alertLower → alert
 */
function evaluateBodyFat(
  value: number,
  gender: Gender,
  bracket: AgeBracket,
): MetricStatus {
  const t = BODY_FAT_TABLE[gender][bracket]
  if (value < t.lower) return 'warning'
  if (value <= t.upper) return 'normal'
  if (value < t.alertLower) return 'warning'
  return 'alert'
}

/**
 * Marca % masa muscular contra la tabla por edad × género (PLAN §6.4/§6.5).
 * Solo se penaliza el lado bajo: < lower → warning. Valores altos se
 * consideran normales (no son clínicamente problemáticos).
 */
function evaluateMuscle(
  value: number,
  gender: Gender,
  bracket: AgeBracket,
): MetricStatus {
  const t = MUSCLE_TABLE[gender][bracket]
  if (value < t.lower) return 'warning'
  return 'normal'
}

/**
 * Marca grasa visceral (PLAN §6.6).
 *  - 1-9   → normal
 *  - 10-14 → warning (atención)
 *  - ≥ 15  → alert (alta)
 */
function evaluateVisceralFat(value: number): MetricStatus {
  if (value <= 9) return 'normal'
  if (value <= 14) return 'warning'
  return 'alert'
}

/**
 * Marca peso contra el peso ideal (Lorentz + contextura, PLAN §6.8).
 *  - Dentro de ±10% del ideal → normal
 *  - Entre 10% y 20% de desvío → warning
 *  - Más del 20% de desvío → alert
 */
function evaluateWeight(
  weight: number,
  idealKg: number,
): MetricStatus {
  if (!idealKg) return 'normal'
  const diff = Math.abs(weight - idealKg) / idealKg
  if (diff <= 0.1) return 'normal'
  if (diff <= 0.2) return 'warning'
  return 'alert'
}

/**
 * Marca calorías comparando con la TMB (Mifflin-St Jeor, PLAN §6.9).
 *  - Dentro de TMB ±300 → normal
 *  - Fuera de ±300 → warning
 *
 * No se eleva a alert porque una ingesta atípica puede responder a
 * objetivos deportivos (cutting/bulking) y no necesariamente a un
 * desbalance clínico severo.
 */
function evaluateCalories(
  calories: number,
  tmb: number,
): MetricStatus {
  return Math.abs(calories - tmb) <= 300 ? 'normal' : 'warning'
}

/**
 * Marca edad biológica contra la edad cronológica (PLAN §6.7).
 *  - bioAge ≤ age + 5 → normal (incluye "mejor que cronológica", no es
 *    problema, no se flaggea)
 *  - bioAge > age + 5 → warning (mayor que cronológica)
 */
function evaluateBioAge(bioAge: number, age: number): MetricStatus {
  return bioAge <= age + 5 ? 'normal' : 'warning'
}

/**
 * Formatea un rango ideal como "min – max" con un decimal cuando aplica.
 * Centraliza la presentación para que sea consistente entre métricas.
 */
function formatRange(min: number, max: number, decimals = 1): string {
  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(decimals)
  return `${fmt(min)} – ${fmt(max)}`
}

/**
 * Construye el `MetricEvaluation` para una métrica NO provista
 * (campo opcional en 0). La UI la muestra como "no medida" y no la
 * incluye en el semáforo global.
 */
function notProvided(key: MetricKey): MetricEvaluation {
  return {
    key,
    provided: false,
    value: null,
    status: 'normal',
    idealRange: null,
    messageKey: 'results.status.normal',
  }
}

/**
 * Devuelve la clave i18n genérica según el estado de la métrica.
 * El texto concreto se carga desde `results.status.{normal|warning|alert}`.
 */
function statusMessageKey(status: MetricStatus): string {
  return `results.status.${status}`
}

/**
 * API principal: evalúa un registro contra los rangos médicos para un
 * cliente dado. Devuelve SIEMPRE 7 entradas, una por métrica, en el
 * orden de `MetricKey`. Las métricas no provistas llegan con
 * `provided: false`.
 */
export function evaluate(
  record: {
    weight: number
    bmi: number
    bodyFatPct: number
    muscleMassPct: number
    calories: number
    bioAge: number
    visceralFat: number
  },
  client: Client,
): MetricEvaluation[] {
  const bracket = ageBracket(client.age)
  const ideal = idealWeightKg(client)
  const tmb = basalMetabolicRate(client, record.weight)
  const bmi = effectiveBmi(record, client)

  const evaluations: MetricEvaluation[] = []

  // 1. Peso
  evaluations.push({
    key: 'weight',
    provided: record.weight > 0,
    value: record.weight > 0 ? record.weight : null,
    status: record.weight > 0 ? evaluateWeight(record.weight, ideal) : 'normal',
    idealRange: `${ideal.toFixed(1)} kg (±10%)`,
    messageKey: statusMessageKey(
      record.weight > 0 ? evaluateWeight(record.weight, ideal) : 'normal',
    ),
  })

  // 2. IMC
  evaluations.push({
    key: 'bmi',
    provided: bmi > 0,
    value: bmi > 0 ? bmi : null,
    status: bmi > 0 ? evaluateBmi(bmi) : 'normal',
    idealRange: '18.5 – 24.9',
    messageKey: statusMessageKey(bmi > 0 ? evaluateBmi(bmi) : 'normal'),
  })

  // 3. % Grasa
  if (record.bodyFatPct > 0) {
    const status = evaluateBodyFat(record.bodyFatPct, client.gender, bracket)
    const range = BODY_FAT_TABLE[client.gender][bracket]
    evaluations.push({
      key: 'bodyFatPct',
      provided: true,
      value: record.bodyFatPct,
      status,
      idealRange: formatRange(range.lower, range.upper),
      messageKey: statusMessageKey(status),
    })
  } else {
    evaluations.push(notProvided('bodyFatPct'))
  }

  // 4. % Masa muscular
  if (record.muscleMassPct > 0) {
    const status = evaluateMuscle(record.muscleMassPct, client.gender, bracket)
    const range = MUSCLE_TABLE[client.gender][bracket]
    evaluations.push({
      key: 'muscleMassPct',
      provided: true,
      value: record.muscleMassPct,
      status,
      idealRange: `≥ ${range.lower}%`,
      messageKey: statusMessageKey(status),
    })
  } else {
    evaluations.push(notProvided('muscleMassPct'))
  }

  // 5. Calorías
  evaluations.push({
    key: 'calories',
    provided: record.calories > 0,
    value: record.calories > 0 ? record.calories : null,
    status:
      record.calories > 0 ? evaluateCalories(record.calories, tmb) : 'normal',
    idealRange: `${Math.round(tmb - 300)} – ${Math.round(tmb + 300)} kcal`,
    messageKey: statusMessageKey(
      record.calories > 0 ? evaluateCalories(record.calories, tmb) : 'normal',
    ),
  })

  // 6. Edad biológica
  if (record.bioAge > 0) {
    const status = evaluateBioAge(record.bioAge, client.age)
    evaluations.push({
      key: 'bioAge',
      provided: true,
      value: record.bioAge,
      status,
      idealRange: `${client.age - 5} – ${client.age + 5} años`,
      messageKey: statusMessageKey(status),
    })
  } else {
    evaluations.push(notProvided('bioAge'))
  }

  // 7. Grasa visceral
  evaluations.push({
    key: 'visceralFat',
    provided: record.visceralFat > 0,
    value: record.visceralFat > 0 ? record.visceralFat : null,
    status:
      record.visceralFat > 0
        ? evaluateVisceralFat(record.visceralFat)
        : 'normal',
    idealRange: '1 – 9',
    messageKey: statusMessageKey(
      record.visceralFat > 0
        ? evaluateVisceralFat(record.visceralFat)
        : 'normal',
    ),
  })

  return evaluations
}