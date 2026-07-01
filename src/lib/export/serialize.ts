/**
 * Serializa un cliente + sus registros a una estructura apta para exportar
 * a Excel o PDF. Es una función pura (sin acceso a i18n ni a Dexie) para
 * poder testearla sin contexto de UI.
 *
 * El caller debe:
 * - Pre-computar las evaluaciones (vía `evaluate()`) por cada registro.
 * - Proveer las etiquetas traducidas para métricas, estados, género, etc.
 *
 * Esto separa la lógica de "qué se exporta" de la lógica de "cómo se
 * presenta" y permite agregar formatos (CSV, JSON) sin tocar el modelo.
 */
import type { MetricEvaluation, MetricKey, MetricStatus, WristContexture, Gender } from '@/types'

export interface ExportClientHeader {
  firstName: string
  lastName1: string
  lastName2: string
  birthDate: string
  age: number
  gender: Gender
  heightCm: number
  wristContexture: WristContexture
}

export interface ExportRecordInput {
  date: Date
  evaluations: MetricEvaluation[]
}

export interface ExportLabels {
  metrics: Record<MetricKey, { label: string; suffix: string; idealLabel: string }>
  status: Record<MetricStatus, string>
  gender: Record<Gender, string>
  contexture: Record<WristContexture, string>
  /** Encabezado de la columna "Rango ideal". */
  idealRange: string
  /** Encabezado de la columna "Estado". */
  statusHeader: string
  /** Encabezado de la columna "Métrica". */
  metricHeader: string
  /** Encabezado de la columna "Valor". */
  valueHeader: string
  /** Texto que aparece antes del nombre del cliente en el PDF, ej. "Cliente". */
  clientTitle: string
  /** Texto que aparece antes de la fecha de cada medición. */
  measurementTitle: string
  /** Texto "Generado el ...". */
  generatedAt: (date: Date) => string
}

export interface ExportRow {
  metric: string
  value: string
  unit: string
  idealRange: string
  status: string
  statusKey: MetricStatus
}

export interface ExportSection {
  date: Date
  title: string
  rows: ExportRow[]
}

export interface ExportPayload {
  fullName: string
  header: {
    fullName: string
    birthDate: string
    age: number
    gender: string
    heightCm: number
    wristContexture: string
  }
  sections: ExportSection[]
  generatedAt: Date
  /** Headers traducidos de las columnas (métrica / valor / rango / estado). */
  columnHeaders: {
    metric: string
    value: string
    unit: string
    idealRange: string
    status: string
  }
  /** Labels contextuales para títulos en el PDF/Excel. */
  titles: {
    client: string
    measurement: string
    generatedAt: string
  }
}

const METRIC_ORDER: MetricKey[] = [
  'weight',
  'bmi',
  'bodyFatPct',
  'muscleMassPct',
  'calories',
  'bioAge',
  'visceralFat',
]

export function serializeForExport(
  client: ExportClientHeader,
  records: ExportRecordInput[],
  labels: ExportLabels,
): ExportPayload {
  const fullName = [client.firstName, client.lastName1, client.lastName2]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ')

  const sections: ExportSection[] = records.map((rec) => ({
    date: rec.date,
    title: labels.measurementTitle,
    rows: buildRows(rec.evaluations, labels),
  }))

  return {
    fullName,
    header: {
      fullName,
      birthDate: client.birthDate,
      age: client.age,
      gender: labels.gender[client.gender],
      heightCm: client.heightCm,
      wristContexture: labels.contexture[client.wristContexture],
    },
    sections,
    generatedAt: new Date(),
    columnHeaders: {
      metric: labels.metricHeader,
      value: labels.valueHeader,
      unit: '',
      idealRange: labels.idealRange,
      status: labels.statusHeader,
    },
    titles: {
      client: labels.clientTitle,
      measurement: labels.measurementTitle,
      generatedAt: labels.generatedAt(new Date()),
    },
  }
}

function buildRows(evaluations: MetricEvaluation[], labels: ExportLabels): ExportRow[] {
  return METRIC_ORDER.map((key) => {
    const ev = evaluations.find((e) => e.key === key)
    const meta = labels.metrics[key]
    if (!ev) {
      return {
        metric: meta.label,
        value: '-',
        unit: meta.suffix,
        idealRange: meta.idealLabel,
        status: labels.status.normal,
        statusKey: 'normal',
      }
    }
    return {
      metric: meta.label,
      value: String(ev.value),
      unit: meta.suffix,
      idealRange: ev.idealRange ?? meta.idealLabel,
      status: labels.status[ev.status],
      statusKey: ev.status,
    }
  })
}

export const EXPORT_HEADERS = {
  metric: 'metricHeader',
  value: 'valueHeader',
  idealRange: 'idealRange',
  status: 'statusHeader',
} as const
