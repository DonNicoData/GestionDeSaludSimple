import { useTranslation } from 'react-i18next'
import { SemaphoreBadge } from './SemaphoreBadge'
import type { MetricEvaluation, MetricKey } from '@/types'

interface MetricCardProps {
  evaluation: MetricEvaluation
}

const statusToBorder: Record<MetricEvaluation['status'], string> = {
  normal: 'border-divider',
  warning: 'border-warning/60',
  alert: 'border-alert/60',
}

const statusToAccent: Record<MetricEvaluation['status'], string> = {
  normal: 'before:bg-primary',
  warning: 'before:bg-warning',
  alert: 'before:bg-alert',
}

/**
 * Formatea un número con decimales. Sin separador de miles para mantener
 * números de salud compactos. Los enteros se muestran sin `.0`.
 */
function formatValue(value: number): string {
  if (Number.isInteger(value)) return value.toString()
  return value.toFixed(1)
}

/**
 * Tarjeta individual de métrica. Muestra:
 * - Etiqueta de la métrica
 * - Valor (las 7 son requeridas, siempre hay valor)
 * - Badge de semáforo
 * - Rango ideal como pie informativo
 *
 * El mensaje inferior (debajo del rango ideal) viene de una clave i18n
 * específica para la métrica cuando existe (`results.metrics.{key}.message.{status}`),
 * o del mensaje genérico de estado (`results.status.{status}`) en caso
 * contrario. Esto permite mensajes contexture-aware en el peso (la única
 * métrica que actualmente usa contextura para la evaluación) sin obligar
 * a traducir mensajes métrica por métrica.
 */
export function MetricCard({ evaluation }: MetricCardProps) {
  const { t } = useTranslation()
  const { key, value, status, idealRange } = evaluation

  return (
    <div
      className={[
        'relative rounded-2xl border-2 bg-white p-4 sm:p-5 shadow-soft',
        'before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-r-full',
        statusToBorder[status],
        statusToAccent[status],
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm sm:text-base font-semibold text-graphite leading-tight">
          {t(`results.metrics.${key}.label` as `results.metrics.${MetricKey}.label`)}
        </h3>
        <SemaphoreBadge status={status} />
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl sm:text-3xl font-bold text-graphite tabular-nums">
          {formatValue(value)}
        </span>
        <span className="text-sm text-graphite/60">
          {t(`results.metrics.${key}.suffix` as `results.metrics.${MetricKey}.suffix`)}
        </span>
      </div>

      {idealRange && (
        <p className="text-xs text-graphite/60 leading-relaxed">
          <span className="font-medium text-graphite/80">
            {t(`results.metrics.${key}.idealLabel` as `results.metrics.${MetricKey}.idealLabel`)}:{' '}
          </span>
          {idealRange}
        </p>
      )}

      {key === 'weight' && evaluation.contexture && (
        <p className="text-xs text-graphite/50 italic leading-relaxed mt-0.5">
          ↳{' '}
          {t(
            `results.metrics.weight.methodologyWithValue` as 'results.metrics.weight.methodologyWithValue',
            {
              contexture: t(
                `basicForm.fields.wristContexture.options.${evaluation.contexture}`,
              ),
              defaultValue: t('results.metrics.weight.methodology'),
            },
          )}
        </p>
      )}

      <p
        className={[
          'text-xs mt-2 leading-relaxed font-medium',
          status === 'normal' && 'text-primary-dark',
          status === 'warning' && 'text-graphite',
          status === 'alert' && 'text-alert',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {t(
          `results.metrics.${key}.message.${status}` as `results.metrics.${MetricKey}.message.normal | warning | alert`,
          { defaultValue: t(`results.status.${status}`) },
        )}
      </p>
    </div>
  )
}