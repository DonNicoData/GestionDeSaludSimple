import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'

interface DiscardConfirmDialogProps {
  open: boolean
  onStay: () => void
  onDiscard: () => void
}

/**
 * Modal de confirmación cálido para descartar datos no guardados (PLAN §7.8).
 *
 * Se dispara cuando el usuario intenta salir (logo como home, botón
 * "Volver al inicio" desde Results, "Skip" del modal de guardado) y hay
 * cambios en memoria o en drafts que no se persistieron.
 *
 * Tono: honesto pero no alarmista. La decisión destructiva está a la
 * derecha y es outline; la conservadora (quedarse) es primary.
 */
export function DiscardConfirmDialog({
  open,
  onStay,
  onDiscard,
}: DiscardConfirmDialogProps) {
  const { t } = useTranslation()
  const stayRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (open) {
      // Foco al botón conservador para que Enter no descarte por accidente.
      stayRef.current?.focus()
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onStay()
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [open, onStay])

  if (!open) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="discard-dialog-title"
      aria-describedby="discard-dialog-body"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-graphite/40 backdrop-blur-sm"
      onClick={onStay}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-bone shadow-card p-5 sm:p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div
            aria-hidden="true"
            className="h-14 w-14 rounded-full bg-warning/20 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-warning"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2
            id="discard-dialog-title"
            className="text-lg sm:text-xl font-bold text-graphite"
          >
            {t('common.discardConfirm.title')}
          </h2>
          <p
            id="discard-dialog-body"
            className="text-sm text-graphite/70 leading-relaxed"
          >
            {t('common.discardConfirm.body')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            ref={stayRef}
            type="button"
            variant="outline"
            size="md"
            onClick={onDiscard}
            fullWidth
          >
            {t('common.discardConfirm.discard')}
          </Button>
          <Button
            type="button"
            size="md"
            onClick={onStay}
            fullWidth
          >
            {t('common.discardConfirm.stay')}
          </Button>
        </div>
      </div>
    </div>
  )
}