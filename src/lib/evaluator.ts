import type {
  Client,
  Gender,
  MetricEvaluation,
  MetricStatus,
  WristContexture,
} from '@/types'

/**
 * Evaluador de métricas contra rangos médicos estándar.
 *
 * Funciones PURAS, sin React, sin i18n ni DOM. Devuelven un `MetricEvaluation`
 * por métrica con el estado (`normal` | `warning` | `alert`) y metadatos
 * (rango ideal formateado, clave de mensaje i18n) para que la UI los pinte.
 *
 * Las 7 métricas son REQUERIDAS: los valores los trae el profesional de
 * su equipo de medición (báscula inteligente, examen de composición
 * corporal). No se contempla el caso "no medido".
 *
 * Fuentes (PLAN.md §6):
 * - IMC: OMS (universal)
 * - % Grasa y % Músculo: American Council on Exercise (rangos por edad × género)
 * - Grasa visceral: rangos universales de bioimpedancia
 * - Edad biológica: comparación con edad cronológica ±5 años
 * - Peso ideal: Lorentz ajustado por contextura de muñeca
 * - Calorías: Mifflin-St Jeor (TMB) ±300 kcal
 *
 * La contextura de muñeca (thin/normal/thick) ajusta:
 *   - Peso ideal (Lorentz × factor 0.95/1.00/1.05) — estándar.
 *   - % Grasa y % Músculo (±1-2%) — ver bloque "PARÁMETROS SUJETOS A
 *     AJUSTE FUTURO" más abajo.
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

// ╔════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  PARÁMETROS SUJETOS A AJUSTE FUTURO                          ║
// ║                                                                  ║
// ║  Los ajustes aplicados por contextura de muñeca (±1-2%) son       ║
// ║  aproximaciones clínicas documentadas en PLAN.md §6. Si el        ║
// ║  producto final requiere calibración fina (feedback de            ║
// ║  profesionales, papers, guías actualizadas), modificar las        ║
// ║  constantes siguientes y verificar con los tests marcados con    ║
// ║  "// CONTEXTURE" en __tests__/evaluator.test.ts.                 ║
// ║                                                                  ║
// ║  Ver MILESTONES.md → "⚠️ PUNTO DE CALIBRACIÓN FUTURO"            ║
// ╚════════════════════════════════════════════════════════════════════╝

/**
 * Ajusta los rangos de % grasa corporal según la contextura de muñeca
 * del cliente. Constitución ósea explica parte del % graso: una persona
 * con contextura gruesa tiene más tejido magro, por lo que puede tolerar
 * un % graso ligeramente mayor sin riesgo clínico.
 *
 * Ajuste: ±1% en `acceptableUpper`+`alertLower` (thick) o `lower` (thin).
 * ⚠️ Sujeto a calibración futura.
 */
function adjustBodyFatRange(
  table: { lower: number; upper: number; acceptableUpper: number; alertLower: number },
  contexture: WristContexture,
): { lower: number; upper: number; acceptableUpper: number; alertLower: number } {
  if (contexture === 'thick') {
    return {
      ...table,
      acceptableUpper: table.acceptableUpper + 1,
      alertLower: table.alertLower + 1,
    }
  }
  if (contexture === 'thin') {
    return {
      ...table,
      lower: Math.max(3, table.lower - 1),
    }
  }
  return table
}

/**
 * Ajusta el límite inferior del rango "normal" de % masa muscular según
 * la contextura de muñeca. Una persona con contextura gruesa tiene +masa
 * ósea y +masa muscular por constitución, por lo que el "normal" mínimo
 * es más alto. Una persona con contextura delgada tiene menos hueso, y
 * por lo tanto el mínimo sano es más bajo.
 *
 * Ajuste: ±2% en `lower`.
 * ⚠️ Sujeto a calibración futura.
 */
function adjustMuscleRange(
  table: { lower: number; upper: number },
  contexture: WristContexture,
): { lower: number; upper: number } {
  if (contexture === 'thick') {
    return { ...table, lower: table.lower + 2 }
  }
  if (contexture === 'thin') {
    return { ...table, lower: Math.max(10, table.lower - 2) }
  }
  return table
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
 * Recomendación diaria de agua en litros, basada en el peso corporal.
 * Fórmula: 35 ml × kg (rango estándar EFSA / IOM: 30–35 ml/kg).
 *
 * Se redondea a 1 decimal para que la lectura en pantalla sea amable.
 * La fórmula es conservadora a propósito: si en el futuro queremos
 * ajustar por actividad física o clima, este helper será el punto de
 * extensión (no la UI).
 */
export function recommendedWaterIntakeLiters(weightKg: number): number {
  const liters = (weightKg * 35) / 1000
  return Math.round(liters * 10) / 10
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
 * Marca % grasa contra una tabla (ya ajustada por contextura si corresponde).
 *  - < lower → warning (demasiado bajo)
 *  - lower..upper → normal
 *  - upper..acceptableUpper → warning (aceptable)
 *  - ≥ alertLower → alert
 */
function evaluateBodyFatWithRange(
  value: number,
  range: { lower: number; upper: number; acceptableUpper: number; alertLower: number },
): MetricStatus {
  if (value < range.lower) return 'warning'
  if (value <= range.upper) return 'normal'
  if (value < range.alertLower) return 'warning'
  return 'alert'
}

/**
 * Marca % masa muscular contra una tabla (ya ajustada por contextura si corresponde).
 * Solo se penaliza el lado bajo: < lower → warning. Valores altos se
 * consideran normales (no son clínicamente problemáticos).
 */
function evaluateMuscleWithRange(
  value: number,
  range: { lower: number; upper: number },
): MetricStatus {
  if (value < range.lower) return 'warning'
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
 * Devuelve la clave i18n genérica según el estado de la métrica.
 * El texto concreto se carga desde `results.status.{normal|warning|alert}`.
 */
function statusMessageKey(status: MetricStatus): string {
  return `results.status.${status}`
}

/**
 * Construye el `idealRange` para el peso en formato expandido
 * "min – max kg (Lorentz × contextura {thin|normal|thick})".
 */
function formatWeightIdealRange(
  idealKg: number,
  contexture: WristContexture,
): string {
  const min = idealKg * 0.9
  const max = idealKg * 1.1
  return `${min.toFixed(1)} – ${max.toFixed(1)} kg (×${contexture})`
}

/**
 * API principal: evalúa un registro contra los rangos médicos para un
 * cliente dado. Devuelve SIEMPRE 7 entradas, una por métrica, en el
 * orden de `MetricKey`. Las 7 métricas son requeridas, así que siempre
 * llegan con `value` numérico.
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
  const bodyFatRange = adjustBodyFatRange(
    BODY_FAT_TABLE[client.gender][bracket],
    client.wristContexture,
  )
  const muscleRange = adjustMuscleRange(
    MUSCLE_TABLE[client.gender][bracket],
    client.wristContexture,
  )

  const evaluations: MetricEvaluation[] = []

  // 1. Peso
  const weightStatus = evaluateWeight(record.weight, ideal)
  evaluations.push({
    key: 'weight',
    value: record.weight,
    status: weightStatus,
    idealRange: formatWeightIdealRange(ideal, client.wristContexture),
    messageKey: statusMessageKey(weightStatus),
    contexture: client.wristContexture,
  })

  // 2. IMC
  const bmiStatus = evaluateBmi(record.bmi)
  evaluations.push({
    key: 'bmi',
    value: record.bmi,
    status: bmiStatus,
    idealRange: '18.5 – 24.9',
    messageKey: statusMessageKey(bmiStatus),
  })

  // 3. % Grasa (ajustado por contextura)
  const bodyFatStatus = evaluateBodyFatWithRange(record.bodyFatPct, bodyFatRange)
  evaluations.push({
    key: 'bodyFatPct',
    value: record.bodyFatPct,
    status: bodyFatStatus,
    idealRange: formatRange(bodyFatRange.lower, bodyFatRange.upper),
    messageKey: statusMessageKey(bodyFatStatus),
  })

  // 4. % Masa muscular (ajustado por contextura)
  const muscleStatus = evaluateMuscleWithRange(record.muscleMassPct, muscleRange)
  evaluations.push({
    key: 'muscleMassPct',
    value: record.muscleMassPct,
    status: muscleStatus,
    idealRange: `≥ ${muscleRange.lower}%`,
    messageKey: statusMessageKey(muscleStatus),
  })

  // 5. Calorías
  const caloriesStatus = evaluateCalories(record.calories, tmb)
  evaluations.push({
    key: 'calories',
    value: record.calories,
    status: caloriesStatus,
    idealRange: `${Math.round(tmb - 300)} – ${Math.round(tmb + 300)} kcal`,
    messageKey: statusMessageKey(caloriesStatus),
  })

  // 6. Edad biológica
  const bioAgeStatus = evaluateBioAge(record.bioAge, client.age)
  evaluations.push({
    key: 'bioAge',
    value: record.bioAge,
    status: bioAgeStatus,
    idealRange: `${client.age - 5} – ${client.age + 5} años`,
    messageKey: statusMessageKey(bioAgeStatus),
  })

  // 7. Grasa visceral
  const visceralStatus = evaluateVisceralFat(record.visceralFat)
  evaluations.push({
    key: 'visceralFat',
    value: record.visceralFat,
    status: visceralStatus,
    idealRange: '1 – 9',
    messageKey: statusMessageKey(visceralStatus),
  })

  return evaluations
}