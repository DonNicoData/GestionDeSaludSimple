import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { getClient, getRecordsForClient } from '@/db/repo'
import { fullNameOf } from '@/lib/name'
import { evaluate } from '@/lib/evaluator'
import type { Client, MetricEvaluation, Record } from '@/types'

interface HistoryPageProps {
  clientId: number
  onBack: () => void
}

/**
 * Pantalla de historial del cliente (Fase 6).
 *
 * Lista todos los registros previos del cliente (ordenados del más reciente
 * al más antiguo), con una mini-tarjeta por registro que muestra:
 * - Fecha
 * - Peso (referencia rápida)
 * - Conteo de advertencias y alertas (semáforo agregado)
 *
 * Detalle por registro al expandir o click → muestra las 7 evaluaciones.
 * PLAN §7.6 define los mensajes cálidos para cada estado (primer registro,
 * 2-3 registros, 4+, etc.).
 */
export function HistoryPage({ clientId, onBack }: HistoryPageProps) {
  const { t } = useTranslation()
  const [client, setClient] = useState<Client | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [c, r] = await Promise.all([
        getClient(clientId),
        getRecordsForClient(clientId),
      ])
      if (cancelled) return
      setClient(c ?? null)
      setRecords(r)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [clientId])

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16 text-center text-graphite/60">
        {t('common.loading')}
      </section>
    )
  }

  if (!client) {
    return (
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        <p className="text-graphite/70 text-center">{t('history.notFound')}</p>
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={onBack}>{t('common.back')}</Button>
        </div>
      </section>
    )
  }

  const count = records.length
  const summaryKey =
    count === 0
      ? 'history.summary.empty'
      : count === 1
        ? 'history.summary.one'
        : count < 4
          ? 'history.summary.few'
          : 'history.summary.many'

  const summaryText =
    count === 0
      ? t('history.summary.empty')
      : t(summaryKey, { count })

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <header className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-graphite">
          {t('history.title')}
        </h1>
        <p className="text-sm sm:text-base text-graphite/70 leading-relaxed">
          {t('history.subtitle', { name: fullNameOf(client) })}
        </p>
      </header>

      <div
        className="rounded-2xl border border-primary-soft bg-primary-soft/30 p-5 mb-6"
      >
        <p className="text-sm font-semibold text-graphite mb-1">
          {t('history.timelineTitle')}
        </p>
        <p className="text-sm text-graphite/70 leading-relaxed">{summaryText}</p>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-divider bg-white p-6 text-center">
          <p className="text-sm text-graphite/70">{t('history.noRecords')}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 mb-6">
          {records.map((rec) => (
            <RecordCard
              key={rec.id}
              record={rec}
              client={client}
              expanded={expandedId === rec.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === rec.id ? null : (rec.id ?? null)))
              }
            />
          ))}
        </ul>
      )}

      <div className="pt-2">
        <Button type="button" variant="outline" size="lg" onClick={onBack} fullWidth>
          {t('common.back')}
        </Button>
      </div>
    </section>
  )
}

interface RecordCardProps {
  record: Record
  client: Client
  expanded: boolean
  onToggle: () => void
}

function RecordCard({ record, client, expanded, onToggle }: RecordCardProps) {
  const { t } = useTranslation()

  const evaluations: MetricEvaluation[] = evaluate(
    {
      weight: record.weight,
      bmi: record.bmi,
      bodyFatPct: record.bodyFatPct,
      muscleMassPct: record.muscleMassPct,
      calories: record.calories,
      bioAge: record.bioAge,
      visceralFat: record.visceralFat,
    },
    client,
  )

  const alerts = evaluations.filter((e) => e.status === 'alert').length
  const warnings = evaluations.filter((e) => e.status === 'warning').length
  const normals = evaluations.filter((e) => e.status === 'normal').length

  const dateText = formatDate(record.date, t)

  const dotColor =
    alerts > 0 ? 'bg-alert' : warnings > 0 ? 'bg-warning' : 'bg-primary'

  return (
    <li className="rounded-2xl border border-divider bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-primary-soft/20 transition-colors"
      >
        <span
          aria-hidden="true"
          className={`shrink-0 h-3 w-3 rounded-full ${dotColor}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-graphite">{dateText}</p>
          <p className="text-xs text-graphite/70">
            {t('history.recordSummary', {
              weight: record.weight,
              alerts,
              warnings,
              normals,
            })}
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 text-graphite/50 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-divider">
          <ul className="flex flex-col gap-2 mt-2">
            {evaluations.map((ev) => (
              <li
                key={ev.key}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-graphite">
                  {t(`results.metrics.${ev.key}.label`)}
                </span>
                <span
                  className={
                    ev.status === 'alert'
                      ? 'text-alert font-semibold'
                      : ev.status === 'warning'
                        ? 'text-warning font-semibold'
                        : 'text-graphite/70'
                  }
                >
                  {ev.value} {t(`results.metrics.${ev.key}.suffix`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

function formatDate(date: Date, t: (k: string) => string): string {
  try {
    return new Intl.DateTimeFormat(t('common.locale') || 'es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return date.toISOString()
  }
}