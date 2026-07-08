import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminAuth } from '@/admin/hooks/useAdminAuth'
import { AdminLoginPage } from '@/admin/pages/AdminLoginPage'
import { AdminListPage } from '@/admin/pages/AdminListPage'
import { AdminClientDetailPage } from '@/admin/pages/AdminClientDetailPage'
import { Button } from '@/components/shared/Button'
import { ConfirmDialog } from '@/admin/components/ConfirmDialog'
import { UndoToastProvider } from '@/admin/components/UndoToast'

type AdminRoute =
  | { kind: 'list' }
  | { kind: 'detail'; clientId: number }

export interface AdminAppProps {
  onClose: () => void
}

/**
 * Shell del admin. Maneja routing interno (state-based, no URL), login
 * y logout. Se monta lazy desde App.tsx.
 *
 * Decisiones:
 * - Routing por state, no por URL: la app no usa router. Mantener todo
 *   en el mismo estilo de navegación de fases previas.
 * - El admin vive en una "página" completa, no en un modal. Decidido
 *   porque el alcance (lista + detalle) es demasiado para un modal.
 * - `onClose` lleva al usuario de vuelta a la app cliente, no al home
 *   necesariamente (App.tsx decide).
 * - El `UndoToastProvider` envuelve toda la app autenticada para que
 *   el patrón de undo de 5s esté disponible en cualquier flujo.
 * - **Refinamiento 2026-07-08**: se quitó la "Zona peligrosa" (wipe
 *   total). Decidido diferir esa acción para una fase futura; la
 *   página completa + dialog se eliminaron del código. `clearAllData`
 *   y `getAdminStats` siguen en repo.ts por si se retoman.
 */
export function AdminApp({ onClose }: AdminAppProps): ReactNode {
  const { t } = useTranslation()
  const auth = useAdminAuth()
  const [route, setRoute] = useState<AdminRoute>({ kind: 'list' })
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  if (!auth.authenticated) {
    return (
      <AdminLoginPage
        submitting={auth.submitting}
        errorKey={auth.errorKey}
        lockedSecondsRemaining={auth.lockedSecondsRemaining}
        onSubmit={auth.login}
        onBack={onClose}
      />
    )
  }

  return (
    <UndoToastProvider>
      <div className="min-h-screen bg-bone">
        <header className="sticky top-0 z-30 backdrop-blur bg-bone/80 border-b border-divider">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden="true"
                className="h-9 w-9 rounded-full bg-graphite flex items-center justify-center text-white shrink-0"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              </span>
              <span className="font-semibold text-base sm:text-lg truncate text-graphite">
                {t('admin.shell.title')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLogoutConfirmOpen(true)}
              >
                {t('admin.shell.logout')}
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
          {route.kind === 'list' && (
            <AdminListPage
              onOpenClient={(id) => setRoute({ kind: 'detail', clientId: id })}
              onBack={onClose}
            />
          )}
          {route.kind === 'detail' && (
            <AdminClientDetailPage
              clientId={route.clientId}
              onBack={() => setRoute({ kind: 'list' })}
            />
          )}
        </main>

        <ConfirmDialog
          open={logoutConfirmOpen}
          title={t('admin.shell.logoutConfirmTitle')}
          body={t('admin.shell.logoutConfirmBody')}
          confirmLabel={t('admin.shell.logoutConfirmLeave')}
          cancelLabel={t('admin.shell.logoutConfirmStay')}
          onConfirm={() => {
            setLogoutConfirmOpen(false)
            auth.logout()
          }}
          onCancel={() => setLogoutConfirmOpen(false)}
        />
      </div>
    </UndoToastProvider>
  )
}
