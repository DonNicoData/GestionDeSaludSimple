import { useTranslation } from 'react-i18next'
import { AdminStatsHeader } from '@/admin/components/AdminStatsHeader'
import { ClientSearchBar } from '@/admin/components/ClientSearchBar'
import { ClientCard } from '@/admin/components/ClientCard'
import { useClients } from '@/admin/hooks/useClients'
import { Button } from '@/components/shared/Button'

interface AdminListPageProps {
  onOpenClient: (clientId: number) => void
  onBack: () => void
}

/**
 * Lista de clientes con búsqueda, stats y cards.
 *
 * Estado vacío (sin clientes registrados): copy cálido, sin CTAs
 * agresivos (PLAN §7.7: "Aún no hay clientes registrados").
 *
 * Búsqueda vacía: copy cálido ("No encontré clientes con ese nombre")
 * + botón "Ver todos" para limpiar el filtro rápidamente.
 */
export function AdminListPage({ onOpenClient, onBack }: AdminListPageProps) {
  const { t } = useTranslation()
  const { items, allItems, loading, search, setSearch, refresh } = useClients()

  if (loading) {
    return (
      <div className="text-center text-graphite/60 py-12">{t('common.loading')}</div>
    )
  }

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <AdminStatsHeader variant="empty" />
        <div className="rounded-2xl border border-divider bg-white p-8 text-center">
          <p className="text-sm text-graphite/70 leading-relaxed">
            {t('admin.search.noClients')}
          </p>
        </div>
        <Button variant="outline" onClick={onBack} fullWidth>
          {t('admin.actions.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminStatsHeader variant="filled" onRefresh={refresh} />
      <ClientSearchBar value={search} onChange={setSearch} />
      {items.length === 0 ? (
        <div className="rounded-2xl border border-divider bg-white p-6 text-center flex flex-col gap-3">
          <p className="text-sm text-graphite/70 leading-relaxed">
            {t('admin.search.empty')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSearch('')}
          >
            {t('admin.search.viewAll')}
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.client.id}>
              <ClientCard
                item={item}
                onOpen={() =>
                  item.client.id != null && onOpenClient(item.client.id)
                }
              />
            </li>
          ))}
        </ul>
      )}
      <div className="pt-2">
        <Button variant="outline" onClick={onBack} fullWidth>
          {t('admin.actions.back')}
        </Button>
      </div>
    </div>
  )
}
