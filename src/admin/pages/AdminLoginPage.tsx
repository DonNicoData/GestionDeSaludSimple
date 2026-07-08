import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { FormField } from '@/components/form/FormField'
import { Input } from '@/components/shared/Input'

interface AdminLoginPageProps {
  submitting: boolean
  errorKey: 'mismatch' | 'noPassword' | null
  lockedSecondsRemaining: number
  onSubmit: (password: string) => Promise<boolean>
  onBack: () => void
}

/**
 * Login del admin (Fase 8).
 *
 * Tono: sobrio y directo (no cálido como el flujo del cliente). El
 * password se tipea una vez; no hay registro. Si el lockout está
 * activo, el botón queda deshabilitado y se muestra el countdown.
 */
export function AdminLoginPage({
  submitting,
  errorKey,
  lockedSecondsRemaining,
  onSubmit,
  onBack,
}: AdminLoginPageProps) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<'mismatch' | 'noPassword' | null>(
    null,
  )
  const locked = lockedSecondsRemaining > 0

  // Si el componente padre reporta un error (e.g. mismatch del login
  // previo), sincronizamos al state local. Si no, limpiamos.
  useEffect(() => {
    setLocalError(errorKey)
  }, [errorKey])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (locked) return
    setLocalError(null)
    await onSubmit(password)
  }

  return (
    <div className="min-h-screen bg-bone flex flex-col">
      <header className="px-4 sm:px-6 h-16 flex items-center border-b border-divider">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-graphite/70 hover:text-graphite"
        >
          ← {t('admin.login.backToApp')}
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-sm rounded-2xl bg-white border border-divider p-6 sm:p-8 flex flex-col gap-5 shadow-soft"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div
              aria-hidden="true"
              className="h-12 w-12 rounded-full bg-graphite text-white flex items-center justify-center"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-graphite">
              {t('admin.login.title')}
            </h1>
            <p className="text-sm text-graphite/70">
              {t('admin.login.subtitle')}
            </p>
          </div>

          <FormField
            id="admin-password"
            label={t('admin.login.passwordLabel')}
            errorKey={localError === 'mismatch' ? 'admin.login.error' : null}
          >
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              onBlur={() => {}}
              placeholder={t('admin.login.passwordPlaceholder')}
              state={
                localError === 'mismatch' || localError === 'noPassword'
                  ? 'error'
                  : 'neutral'
              }
              autoFocus
            />
          </FormField>

          {localError === 'noPassword' && (
            <p role="alert" className="text-xs text-alert leading-relaxed">
              {t('admin.login.noPasswordConfigured')}
            </p>
          )}

          {locked && (
            <p
              role="status"
              aria-live="polite"
              className="text-xs text-warning font-medium leading-relaxed"
            >
              {t('admin.login.lockedPrefix')} {lockedSecondsRemaining}
              {t('admin.login.lockedSuffix')}
            </p>
          )}

          <Button
            type="submit"
            size="md"
            disabled={submitting || locked || !password}
            fullWidth
          >
            {submitting ? t('common.saving') : t('admin.login.submit')}
          </Button>
        </form>
      </div>
    </div>
  )
}
