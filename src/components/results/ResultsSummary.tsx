import { useTranslation } from 'react-i18next'
import type { MetricEvaluation } from '@/types'

interface ResultsSummaryProps {
  evaluations: MetricEvaluation[]
}

/**
 * Resume el estado global de las 7 métricas y devuelve la clave i18n
 * del mensaje cálido correspondiente (PLAN §7.4).
 *
 * Reglas (las 7 métricas son siempre requeridas):
 *  - 0 alert + 0 warning             → 'allNormal'
 *  - ≥1 alert                        → 'hasAlerts' (con count)
 *  - 1–2 warning sin alert           → 'fewWarnings'
 *  - ≥3 warning sin alert            → 'manyWarnings'
 */
function pickSummaryKey(evaluations: MetricEvaluation[]): {
  key: string
  count?: number
} {
  const alerts = evaluations.filter((e) => e.status === 'alert').length
  const warnings = evaluations.filter((e) => e.status === 'warning').length

  if (alerts > 0) {
    return { key: 'results.summary.hasAlerts', count: alerts }
  }

  if (warnings === 0) {
    return { key: 'results.summary.allNormal' }
  }

  if (warnings <= 2) {
    return { key: 'results.summary.fewWarnings' }
  }

  return { key: 'results.summary.manyWarnings' }
}

/**
 * Banner cálido que resume el estado global del set de métricas.
 * Tono siempre esperanzador, sin culpabilizar (PLAN §7.4).
 */
export function ResultsSummary({ evaluations }: ResultsSummaryProps) {
  const { t } = useTranslation()
  const { key, count } = pickSummaryKey(evaluations)

  const message = count !== undefined ? t(key, { count }) : t(key)

  const alerts = evaluations.filter((e) => e.status === 'alert').length
  const warnings = evaluations.filter((e) => e.status === 'warning').length

  const bannerClasses =
    alerts > 0
      ? 'border-alert/40 bg-alert/10'
      : warnings > 0
        ? 'border-warning/40 bg-warning/10'
        : 'border-primary/40 bg-primary-soft/30'

  return (
    <div
      role="status"
      aria-live="polite"
      className={['rounded-2xl border-2 p-4 sm:p-5', bannerClasses].join(' ')}
    >
      <p className="text-sm sm:text-base text-graphite leading-relaxed">
        {message}
      </p>
    </div>
  )
}