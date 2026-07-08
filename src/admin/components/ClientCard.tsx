import { useTranslation } from 'react-i18next'
import { fullNameOf } from '@/lib/name'
import type { ClientListItem } from '@/admin/hooks/useClients'

interface ClientCardProps {
  item: ClientListItem
  onOpen: () => void
}

export function ClientCard({ item, onOpen }: ClientCardProps) {
  const { t } = useTranslation()
  const { client, lastRecord, recordCount } = item
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-divider bg-white p-4 text-left hover:border-primary-soft hover:shadow-soft transition-all flex items-center gap-3"
    >
      <div
        aria-hidden="true"
        className="h-10 w-10 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-semibold text-sm shrink-0"
      >
        {client.firstName.charAt(0).toUpperCase()}
        {client.lastName1.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-graphite truncate">
          {fullNameOf(client)}
        </p>
        <p className="text-xs text-graphite/60 mt-0.5">
          {t('admin.clientCard.ageAndHeight', {
            age: client.age,
            height: client.heightCm,
          })}
          {' · '}
          {t('admin.clientCard.recordCount', { count: recordCount })}
        </p>
        <p className="text-xs text-graphite/50 mt-0.5">
          {lastRecord
            ? t('admin.clientCard.lastVisit', {
                date: formatDate(lastRecord.date),
              })
            : t('admin.clientCard.lastVisitNever')}
        </p>
      </div>
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-graphite/40 shrink-0"
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
  )
}

function formatDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}
