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
   * Callback que se ejecuta SOLO cuando ambas barreras (tipeo del
   * nombre + reingreso de contraseña) son satisfechas. La validación
   * de la contraseña ocurre dentro del dialog con bcrypt.
   */
  onConfirm: () => void
}

/**
 * Modal de confirmación para borrar un cliente con cascade.
 *
 * Doble barrera (NN/g + sentido común para acciones destructivas):
 * 1. Tipear el nombre completo del cliente (Mailchimp pattern)
 * 2. Re-ingresar la contraseña de admin (re-autenticación)
 *
 * ¿Por qué re-validar la contraseña si el admin ya está logueado?
 * - El admin pudo haber dejado la pestaña abierta y otra persona
 *   sentarse a usarla.
 * - Es un patrón estándar de "sudo mode" (Linux, macOS) para
 *   acciones sensibles.
 * - Coincide con el patrón ya usado en `WipeAllDialog` (consistencia).
 *
 * El undo 5s se ofrece DESPUÉS de confirmar (toast), no es barrera
 * previa porque ya gastamos el esfuerzo de re-autenticar.
 *
 * Decisión de diseño: la contraseña se valida on-submit, no en cada
 * keystroke. Hash bcrypt es caro (50-100ms por hash); hacerlo en cada
 * letra sería molesto. El name-typing sí da feedback instantáneo
 * porque es comparación de strings.
 */
export function DeleteClientDialog({
  client,
  recordCount,
  onCancel,
  onConfirm,
}: DeleteClientDialogProps) {
  const { t } = useTranslation()
  const [typed, setTyped] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const expected = fullNameOf(client)
  const nameMatches = typed.trim() === expected
  const passwordFilled = password.length > 0

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const canSubmit = nameMatches && passwordFilled && !submitting

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
            {t('admin.deleteClient.title', { name: expected })}
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
            htmlFor="delete-client-type"
            className="text-sm font-medium text-graphite"
          >
            {t('admin.deleteClient.typePrompt')}
          </label>
          <input
            ref={inputRef}
            id="delete-client-type"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={expected}
            autoComplete="off"
            className="h-12 px-4 text-base bg-white border-2 border-divider rounded-2xl focus:outline-none focus:border-alert focus-visible:ring-2 focus-visible:ring-alert focus-visible:ring-offset-2 focus-visible:ring-offset-bone"
          />
          {typed.length > 0 && !nameMatches && (
            <p role="alert" className="text-xs text-alert">
              {t('admin.deleteClient.mismatch')}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="delete-client-password"
            className="text-sm font-medium text-graphite"
          >
            {t('admin.deleteClient.passwordLabel')}
          </label>
          <Input
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
            size="md"
            onClick={handleConfirm}
            disabled={!canSubmit}
            fullWidth
            className="bg-alert hover:bg-alert/90 text-white"
          >
            {submitting ? t('common.saving') : t('admin.deleteClient.submit')}
          </Button>
        </div>
      </div>
    </div>
  )
}
