import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminStats, type AdminStats } from '@/db/repo'

interface AdminStatsHeaderProps {
  variant: 'filled' | 'empty'
  /**
   * Stats ya calculados por el padre. Si se omite, el componente las
   * busca por su cuenta vía `getAdminStats()`. Pasar `null` se trata
   * igual que omitir (se considera "el padre no las tiene listas").
   */
  stats?: AdminStats | null
  onRefresh?: () => void
}

/**
 * Header con KPIs del admin: total clientes, total mediciones, fecha
 * del último record. Una sola pasada vía `getAdminStats()` (3 queries
 * paralelas internamente).
 *
 * Regla de fetch:
 * - `stats` omitido o `null` → el componente busca solo (caso normal).
 * - `stats` con un objeto → se usa tal cual (caso lifted-state del
 *   padre, ej. cuando ya cargó la lista y quiere evitar una query
 *   extra).
 *
 * El refresco manual (botón ⟳) bumpea `tick` para volver a fetchear
 * incluso cuando el padre pasa stats pre-calculadas.
 */
export function AdminStatsHeader({
  variant,
  stats: statsProp,
  onRefresh,
}: AdminStatsHeaderProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<AdminStats | null>(
    statsProp && typeof statsProp === 'object' ? statsProp : null,
  )
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (variant === 'empty') return
    if (tick === 0 && statsProp && typeof statsProp === 'object') {
      setStats(statsProp)
      return
    }
    let cancelled = false
    void (async () => {
      const s = await getAdminStats()
      if (cancelled) return
      setStats(s)
    })()
    return () => {
      cancelled = true
    }
  }, [variant, statsProp, tick])

  if (variant === 'empty') {
    return (
      <div className="rounded-2xl border border-divider bg-white p-5">
        <p className="text-sm text-graphite/60">
          {t('admin.search.noClients')}
        </p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-divider bg-white p-5 animate-pulse">
        <div className="h-6 w-40 bg-divider rounded-xl" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-divider bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-graphite/50">
          {t('admin.shell.title')}
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={() => {
              onRefresh()
              setTick((x) => x + 1)
            }}
            aria-label="Refresh"
            className="text-graphite/50 hover:text-graphite"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Kpi
          label={t('admin.stats.clients', { count: stats.clientCount })}
          value={String(stats.clientCount)}
        />
        <Kpi
          label={t('admin.stats.records', { count: stats.recordCount })}
          value={String(stats.recordCount)}
        />
        <Kpi
          label={
            stats.lastRecordAt
              ? t('admin.stats.lastRecord', {
                  date: formatShortDate(stats.lastRecordAt, t),
                })
              : t('admin.stats.lastRecordNever')
          }
          value={
            stats.lastRecordAt
              ? formatShortDate(stats.lastRecordAt, t)
              : '—'
          }
        />
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-graphite/60 leading-tight">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-graphite mt-1 truncate">
        {value}
      </p>
    </div>
  )
}

function formatShortDate(d: Date, t: (k: string) => string): string {
  try {
    return new Intl.DateTimeFormat(t('common.locale') || 'es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}
