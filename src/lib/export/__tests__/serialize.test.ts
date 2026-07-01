import { describe, expect, it } from 'vitest'
import {
  serializeForExport,
  type ExportClientHeader,
  type ExportLabels,
  type ExportRecordInput,
} from '../serialize'
import type { MetricEvaluation } from '@/types'

const baseLabels: ExportLabels = {
  metrics: {
    weight: { label: 'Peso', suffix: 'kg', idealLabel: 'Peso ideal' },
    bmi: { label: 'IMC', suffix: 'kg/m²', idealLabel: 'Rango' },
    bodyFatPct: { label: '% Grasa', suffix: '%', idealLabel: 'Rango' },
    muscleMassPct: { label: '% Músculo', suffix: '%', idealLabel: 'Rango' },
    calories: { label: 'Calorías', suffix: 'kcal', idealLabel: 'TMB' },
    bioAge: { label: 'Edad biológica', suffix: 'años', idealLabel: 'Esperado' },
    visceralFat: { label: 'Grasa visceral', suffix: 'nivel', idealLabel: 'Rango' },
  },
  status: { normal: 'Normal', warning: 'Atención', alert: 'Alerta' },
  gender: { F: 'Mujer', M: 'Hombre' },
  contexture: { thin: 'Delgada', normal: 'Normal', thick: 'Gruesa' },
  idealRange: 'Rango ideal',
  statusHeader: 'Estado',
  metricHeader: 'Métrica',
  valueHeader: 'Valor',
  clientTitle: 'Cliente',
  measurementTitle: 'Medición',
  generatedAt: () => 'Generado el test',
}

function makeClient(overrides: Partial<ExportClientHeader> = {}): ExportClientHeader {
  return {
    firstName: 'María',
    lastName1: 'García',
    lastName2: 'López',
    birthDate: '1990-01-01',
    age: 35,
    gender: 'F',
    heightCm: 165,
    wristContexture: 'normal',
    ...overrides,
  }
}

function makeEvaluations(overrides: Record<string, MetricEvaluation> = {}): MetricEvaluation[] {
  const defaults: Record<string, MetricEvaluation> = {
    weight: { key: 'weight', value: 65, status: 'normal', idealRange: '55 - 70', messageKey: 'm' },
    bmi: { key: 'bmi', value: 23.9, status: 'normal', idealRange: '18.5 - 24.9', messageKey: 'm' },
    bodyFatPct: { key: 'bodyFatPct', value: 32, status: 'warning', idealRange: '21 - 33', messageKey: 'm' },
    muscleMassPct: { key: 'muscleMassPct', value: 30, status: 'normal', idealRange: '30 - 45', messageKey: 'm' },
    calories: { key: 'calories', value: 1400, status: 'alert', idealRange: '~1300', messageKey: 'm' },
    bioAge: { key: 'bioAge', value: 40, status: 'warning', idealRange: '~35', messageKey: 'm' },
    visceralFat: { key: 'visceralFat', value: 8, status: 'normal', idealRange: '1 - 12', messageKey: 'm' },
  }
  const merged: Record<string, MetricEvaluation> = { ...defaults, ...overrides }
  return Object.values(merged)
}

describe('serializeForExport', () => {
  it('compone el nombre completo con espacios', () => {
    const payload = serializeForExport(makeClient(), [], baseLabels)
    expect(payload.header.fullName).toBe('María García López')
  })

  it('omite segmentos vacíos del nombre', () => {
    const payload = serializeForExport(
      makeClient({ lastName2: '   ' }),
      [],
      baseLabels,
    )
    expect(payload.header.fullName).toBe('María García')
  })

  it('traduce género y contextura desde labels', () => {
    const payload = serializeForExport(
      makeClient({ gender: 'M', wristContexture: 'thick' }),
      [],
      baseLabels,
    )
    expect(payload.header.gender).toBe('Hombre')
    expect(payload.header.wristContexture).toBe('Gruesa')
  })

  it('genera una sección por cada record', () => {
    const recs: ExportRecordInput[] = [
      { date: new Date('2026-07-01'), evaluations: makeEvaluations() },
      { date: new Date('2026-06-01'), evaluations: makeEvaluations() },
    ]
    const payload = serializeForExport(makeClient(), recs, baseLabels)
    expect(payload.sections).toHaveLength(2)
    expect(payload.sections[0].date).toEqual(new Date('2026-07-01'))
    expect(payload.sections[1].date).toEqual(new Date('2026-06-01'))
  })

  it('siempre incluye las 7 métricas en el orden canónico', () => {
    const recs: ExportRecordInput[] = [
      { date: new Date(), evaluations: makeEvaluations() },
    ]
    const payload = serializeForExport(makeClient(), recs, baseLabels)
    const keys = payload.sections[0].rows.map((r) => r.metric)
    expect(keys).toEqual([
      'Peso',
      'IMC',
      '% Grasa',
      '% Músculo',
      'Calorías',
      'Edad biológica',
      'Grasa visceral',
    ])
  })

  it('mapea el status al label traducido', () => {
    const recs: ExportRecordInput[] = [
      { date: new Date(), evaluations: makeEvaluations() },
    ]
    const payload = serializeForExport(makeClient(), recs, baseLabels)
    const statusByMetric = Object.fromEntries(
      payload.sections[0].rows.map((r) => [r.metric, { status: r.status, key: r.statusKey }]),
    )
    expect(statusByMetric['Peso']).toEqual({ status: 'Normal', key: 'normal' })
    expect(statusByMetric['% Grasa']).toEqual({ status: 'Atención', key: 'warning' })
    expect(statusByMetric['Calorías']).toEqual({ status: 'Alerta', key: 'alert' })
  })

  it('preserva idealRange de la evaluación (no del label)', () => {
    const recs: ExportRecordInput[] = [
      { date: new Date(), evaluations: makeEvaluations() },
    ]
    const payload = serializeForExport(makeClient(), recs, baseLabels)
    const peso = payload.sections[0].rows.find((r) => r.metric === 'Peso')
    expect(peso?.idealRange).toBe('55 - 70')
  })

  it('usa "-" como valor cuando falta una evaluación', () => {
    const recs: ExportRecordInput[] = [{ date: new Date(), evaluations: [] }]
    const payload = serializeForExport(makeClient(), recs, baseLabels)
    expect(payload.sections[0].rows[0].value).toBe('-')
  })

  it('incluye headers de columna traducidos', () => {
    const payload = serializeForExport(makeClient(), [], baseLabels)
    expect(payload.columnHeaders.metric).toBe('Métrica')
    expect(payload.columnHeaders.value).toBe('Valor')
    expect(payload.columnHeaders.idealRange).toBe('Rango ideal')
    expect(payload.columnHeaders.status).toBe('Estado')
  })
})
