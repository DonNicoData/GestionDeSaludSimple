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

const ariaLabels: Record<MetricStatus, string> = {
  normal: 'Normal',
  warning: 'Atención',
  alert: 'Alerta',
}

export function SemaphoreBadge({ status }: SemaphoreBadgeProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabels[status]}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border-2 text-xs font-semibold',
        statusClasses[status],
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={['h-2 w-2 rounded-full', dotClasses[status]].join(' ')}
      />
      <span className={labelClasses[status]}>
        {ariaLabels[status]}
      </span>
    </span>
  )
}