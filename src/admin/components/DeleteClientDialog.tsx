import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { fullNameOf } from '@/lib/name'
import {
  getAdminPasswordFromEnv,
  hashPassword,
  verifyPassword,
} from '@/admin/auth/hash'
import type { Client } from '@/types'

interface DeleteClientDialogProps {
  client: Client
  recordCount: number
  onCancel: () => void
  /**
   * Callback que se ejecuta SOLO cuando la contraseña fue re-ingresada
   * correctamente. La validación ocurre dentro del dialog con bcrypt.
   */
  onConfirm: () => void
}

/**
 * Modal de confirmación para borrar un cliente con cascade.
 *
 * Barrera única: re-ingresar la contraseña de admin (validada con
 * bcrypt). El undo 5s se ofrece DESPUÉS de confirmar (toast).
 *
 * Decisiones de diseño (revisión tras feedback):
 * - Antes: doble barrera (tipeo del nombre + contraseña). El tipeo
 *   agregaba fricción sin valor real de seguridad: alguien con la
 *   contraseña ya tiene autorización, no necesita tipear también.
 *   Lo simplificamos a UNA sola barrera: la contraseña.
 * - La contraseña se valida on-submit, no on-keystroke: bcrypt es
 *   caro (~50-100ms por hash), hacerlo en cada letra sería molesto.
 * - La copia sigue siendo honesta: avisa cuántas mediciones se
 *   borran en cascade y que hay 5s de undo.
 * - El patrón coincide con WipeAllDialog (que también solo pide
 *   contraseña) para consistencia entre acciones destructivas.
 */
export function DeleteClientDialog({
  client,
  recordCount,
  onCancel,
  onConfirm,
}: DeleteClientDialogProps) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const name = fullNameOf(client)
  const passwordFilled = password.length > 0

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const canSubmit = passwordFilled && !submitting

  const handleConfirm = async () => {
    if (!canSubmit) return
    setPasswordError(null)
    setSubmitting(true)
    try {
      const expectedPwd = getAdminPasswordFromEnv()
      if (!expectedPwd) {
        setPasswordError(t('admin.login.noPasswordConfigured'))
        return
      }
      const expectedHash = await hashPassword(expectedPwd)
      const ok = await verifyPassword(password, expectedHash)
      if (!ok) {
        setPasswordError(t('admin.login.error'))
        return
      }
      onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-client-title"
      aria-describedby="delete-client-body"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-graphite/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-bone shadow-card p-5 sm:p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div
            aria-hidden="true"
            className="h-14 w-14 rounded-full bg-alert/20 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-alert"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <h2
            id="delete-client-title"
            className="text-lg sm:text-xl font-bold text-graphite"
          >
            {t('admin.deleteClient.title', { name })}
          </h2>
          <p
            id="delete-client-body"
            className="text-sm text-graphite/70 leading-relaxed"
          >
            {t('admin.deleteClient.body', { count: recordCount })}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="delete-client-password"
            className="text-sm font-medium text-graphite"
          >
            {t('admin.deleteClient.passwordLabel')}
          </label>
          <Input
            ref={inputRef}
            id="delete-client-password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            state={passwordError ? 'error' : 'neutral'}
          />
          {passwordError && (
            <p role="alert" className="text-xs text-alert">
              {passwordError}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            fullWidth
            disabled={submitting}
          >
            {t('admin.deleteClient.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="md"
            onClick={handleConfirm}
            disabled={!canSubmit}
            fullWidth
          >
            {submitting ? t('common.saving') : t('admin.deleteClient.submit')}
          </Button>
        </div>
      </div>
    </div>
  )
}
