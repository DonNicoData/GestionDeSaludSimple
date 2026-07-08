import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { useToast } from '@/components/shared/Toast'
import { WipeAllDialog } from '@/admin/components/WipeAllDialog'
import { clearAllData, getAdminStats } from '@/db/repo'
import { useClients } from '@/admin/hooks/useClients'

interface AdminDangerZonePageProps {
  onBack: () => void
}

/**
 * Zona peligrosa: una sola acción disponible hoy (borrar todo), pero
 * la página existe como lugar extensible para futuras acciones
 * destructivas (ej. "regenerar DB", "exportar todo y limpiar", etc.).
 */
export function AdminDangerZonePage({ onBack }: AdminDangerZonePageProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [wipeOpen, setWipeOpen] = useState(false)
  const [stats, setStats] = useState<{ clientCount: number; recordCount: number } | null>(null)
  const { refresh } = useClients()

  const handleWipe = async () => {
    await clearAllData()
    setWipeOpen(false)
    const s = await getAdminStats()
    setStats({ clientCount: s.clientCount, recordCount: s.recordCount })
    refresh()
    toast.show(t('admin.wipe.success'))
    onBack()
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-graphite">
          {t('admin.actions.dangerZone')}
        </h1>
      </header>

      <div className="rounded-2xl border-2 border-alert/40 bg-alert/5 p-5 flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-graphite text-lg">
            {t('admin.wipe.title')}
          </h2>
          <p className="text-sm text-graphite/70 mt-1 leading-relaxed">
            {t('admin.wipe.subtitle')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setWipeOpen(true)}
          className="text-alert border-alert/40 hover:bg-alert/10 hover:border-alert self-start"
        >
          {t('admin.wipe.title')}
        </Button>
      </div>

      <div className="pt-2">
        <Button variant="outline" onClick={onBack} fullWidth>
          {t('admin.actions.back')}
        </Button>
      </div>

      {wipeOpen && (
        <WipeAllDialog
          clientCount={stats?.clientCount ?? 0}
          recordCount={stats?.recordCount ?? 0}
          onCancel={() => setWipeOpen(false)}
          onConfirm={handleWipe}
        />
      )}
    </div>
  )
}
