import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { getAdminPasswordFromEnv, verifyPassword, hashPassword } from '@/admin/auth/hash'

interface WipeAllDialogProps {
  clientCount: number
  recordCount: number
  onCancel: () => void
  onConfirm: () => Promise<void>
}

const TYPE_TOKEN_EN = 'DELETE ALL'
const TYPE_TOKEN_ES = 'BORRAR TODO'

/**
 * Triple barrera para borrar todos los datos (acción más destructiva
 * del admin):
 * 1. Tipear literal (en ES: "BORRAR TODO", en EN: "DELETE ALL")
 * 2. Re-ingresar la contraseña de admin
 * 3. Botón final destructive
 *
 * NO hay undo: el wipe borra clientes, records, drafts y meta. La
 * ventana de undo no aplica porque (a) el snapshot sería enorme y
 * (b) la acción es por diseño "punto de no retorno".
 *
 * El copy es honesto sobre lo que se va a borrar (cantidades reales).
 */
export function WipeAllDialog({
  clientCount,
  recordCount,
  onCancel,
  onConfirm,
}: WipeAllDialogProps) {
  const { t, i18n } = useTranslation()
  const [typed, setTyped] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const expectedToken =
    i18n.language.startsWith('es') ? TYPE_TOKEN_ES : TYPE_TOKEN_EN
  const tokenMatches = typed.trim() === expectedToken
  const passwordValid = password.length > 0

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const canSubmit = tokenMatches && passwordValid && !submitting

  const handleConfirm = async () => {
    if (!canSubmit) return
    setPasswordError(null)
    setSubmitting(true)
    try {
      const expected = getAdminPasswordFromEnv()
      if (!expected) {
        setPasswordError(t('admin.login.noPasswordConfigured'))
        return
      }
      const expectedHash = await hashPassword(expected)
      const ok = await verifyPassword(password, expectedHash)
      if (!ok) {
        setPasswordError(t('admin.login.error'))
        return
      }
      await onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="wipe-title"
      aria-describedby="wipe-body"
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
          <h2 id="wipe-title" className="text-lg sm:text-xl font-bold text-graphite">
            {t('admin.wipe.title')}
          </h2>
          <p
            id="wipe-body"
            className="text-sm text-graphite/70 leading-relaxed"
          >
            {t('admin.wipe.subtitle')}
            <br />
            <span className="font-medium text-graphite">
              {t('admin.wipe.stats', { clients: clientCount, records: recordCount })}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="wipe-type" className="text-sm font-medium text-graphite">
            {t('admin.wipe.typePrompt')}
          </label>
          <Input
            id="wipe-type"
            type="text"
            value={typed}
            onChange={setTyped}
            placeholder={expectedToken}
            state={typed.length > 0 && !tokenMatches ? 'error' : 'neutral'}
            autoComplete="off"
          />
          {typed.length > 0 && !tokenMatches && (
            <p role="alert" className="text-xs text-alert">
              {t('admin.wipe.typeMismatch')}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="wipe-password"
            className="text-sm font-medium text-graphite"
          >
            {t('admin.wipe.passwordLabel')}
          </label>
          <Input
            id="wipe-password"
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
            {t('admin.wipe.cancel')}
          </Button>
          <Button
            type="button"
            size="md"
            onClick={handleConfirm}
            disabled={!canSubmit}
            fullWidth
            className="bg-alert hover:bg-alert/90 text-white"
          >
            {submitting ? t('common.saving') : t('admin.wipe.submit')}
          </Button>
        </div>
      </div>
    </div>
  )
}
