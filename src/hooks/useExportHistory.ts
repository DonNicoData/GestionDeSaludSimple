/**
 * Helper de UI para exportar el historial de un cliente. Encapsula:
 * - La construcción de las labels traducidas a partir de i18n.
 * - El armado del payload (serializeForExport).
 * - La llamada a exportToExcel o exportToPdf.
 *
 * Se usa desde el SaveModal (post-guardado) y desde la HistoryPage
 * (descarga bajo demanda). El caller solo se preocupa por el toast.
 */
import { useTranslation } from 'react-i18next'
import {
  serializeForExport,
  exportToExcel,
  exportToPdf,
  type ExportClientHeader,
  type ExportRecordInput,
  type ExportLabels,
} from '@/lib/export'
import { evaluate } from '@/lib/evaluator'
import type { Client, Record } from '@/types'

export type ExportFormat = 'xlsx' | 'pdf'

export function useExportHistory() {
  const { t, i18n } = useTranslation()

  function buildLabels(): ExportLabels {
    return {
      metrics: {
        weight: t('results.metrics.weight', { returnObjects: true }) as ExportLabels['metrics']['weight'],
        bmi: t('results.metrics.bmi', { returnObjects: true }) as ExportLabels['metrics']['bmi'],
        bodyFatPct: t('results.metrics.bodyFatPct', { returnObjects: true }) as ExportLabels['metrics']['bodyFatPct'],
        muscleMassPct: t('results.metrics.muscleMassPct', { returnObjects: true }) as ExportLabels['metrics']['muscleMassPct'],
        calories: t('results.metrics.calories', { returnObjects: true }) as ExportLabels['metrics']['calories'],
        bioAge: t('results.metrics.bioAge', { returnObjects: true }) as ExportLabels['metrics']['bioAge'],
        visceralFat: t('results.metrics.visceralFat', { returnObjects: true }) as ExportLabels['metrics']['visceralFat'],
      },
      status: {
        normal: t('results.statusShort.normal'),
        warning: t('results.statusShort.warning'),
        alert: t('results.statusShort.alert'),
      },
      gender: {
        F: t('form.fields.gender.options.F'),
        M: t('form.fields.gender.options.M'),
      },
      contexture: {
        thin: t('form.fields.wristContexture.options.thin'),
        normal: t('form.fields.wristContexture.options.normal'),
        thick: t('form.fields.wristContexture.options.thick'),
      },
      idealRange: t('results.export.headers.idealRange'),
      statusHeader: t('results.export.headers.status'),
      metricHeader: t('results.export.headers.metric'),
      valueHeader: t('results.export.headers.value'),
      clientTitle: t('results.export.titles.client'),
      measurementTitle: t('results.export.titles.measurement'),
      generatedAt: (date: Date) => {
        const locale = i18n.language === 'en' ? 'en-US' : 'es'
        try {
          const formatted = new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(date)
          return t('results.export.titles.generatedAt', { date: formatted })
        } catch {
          return t('results.export.titles.generatedAt', { date: date.toISOString() })
        }
      },
    }
  }

  function runExport(client: Client, records: Record[], format: ExportFormat): void {
    const inputs: ExportRecordInput[] = records.map((r) => ({
      date: r.date,
      evaluations: evaluate(
        {
          weight: r.weight,
          bmi: r.bmi,
          bodyFatPct: r.bodyFatPct,
          muscleMassPct: r.muscleMassPct,
          calories: r.calories,
          bioAge: r.bioAge,
          visceralFat: r.visceralFat,
        },
        client,
      ),
    }))

    const header: ExportClientHeader = {
      firstName: client.firstName,
      lastName1: client.lastName1,
      lastName2: client.lastName2,
      birthDate: client.birthDate,
      age: client.age,
      gender: client.gender,
      heightCm: client.heightCm,
      wristContexture: client.wristContexture,
    }

    const payload = serializeForExport(header, inputs, buildLabels())

    if (format === 'xlsx') {
      exportToExcel({ client: header, payload })
    } else {
      exportToPdf({ client: header, payload })
    }
  }

  return { runExport }
}
