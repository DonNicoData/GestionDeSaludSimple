import { useTranslation } from 'react-i18next'
import type { MetricStatus } from '@/types'

interface SemaphoreBadgeProps {
  status: MetricStatus
}

/**
 * Pastilla de semáforo para resultados. Pinta el borde y el fondo según
 * el estado y muestra un punto de color como señal visual universal.
 *
 * Estado normal → verde salud (primary).
 * Estado warning → ámbar cálido.
 * Estado alert   → coral suave.
 *
 * Las etiquetas cortas ("Normal", "Atención", "Alerta" en ES;
 * "Normal", "Attention", "Alert" en EN) vienen de i18n
 * (`results.statusShort.{status}`) para que respondan al toggle de idioma.
 */
const statusClasses: Record<MetricStatus, string> = {
  normal: 'border-primary bg-primary-soft/40 text-primary-dark',
  warning: 'border-warning bg-warning/15 text-graphite',
  alert: 'border-alert bg-alert/15 text-alert',
}

const dotClasses: Record<MetricStatus, string> = {
  normal: 'bg-primary',
  warning: 'bg-warning',
  alert: 'bg-alert',
}

const labelClasses: Record<MetricStatus, string> = {
  normal: 'text-primary-dark',
  warning: 'text-graphite',
  alert: 'text-alert',
}

export function SemaphoreBadge({ status }: SemaphoreBadgeProps) {
  const { t } = useTranslation()
  const label = t(`results.statusShort.${status}`)

  return (
    <span
      role="status"
      aria-label={label}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border-2 text-xs font-semibold',
        statusClasses[status],
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={['h-2 w-2 rounded-full', dotClasses[status]].join(' ')}
      />
      <span className={labelClasses[status]}>{label}</span>
    </span>
  )
}