import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  /**
   * Si true, el botón confirmar es destructive (alerta). Default false.
   * Útil para el wipe-all donde el botón es destructive pero no
   * requiere tipeo (porque ya hay tipeo en otra capa).
   */
  destructive?: boolean
}

/**
 * Modal de confirmación cálido pero genérico. Reutilizado para:
 * - Logout del admin.
 * - Wipe-all: combinado con tipeo literal.
 *
 * Para confirmaciones más graves (borrar cliente) usamos el patrón
 * `DeleteClientDialog` con tipeo del nombre.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  if (!open) return null
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-body"
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
            className={`h-14 w-14 rounded-full flex items-center justify-center ${
              destructive ? 'bg-alert/20' : 'bg-warning/20'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-8 w-8 ${destructive ? 'text-alert' : 'text-warning'}`}
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
            id="confirm-dialog-title"
            className="text-lg sm:text-xl font-bold text-graphite"
          >
            {title}
          </h2>
          <p
            id="confirm-dialog-body"
            className="text-sm text-graphite/70 leading-relaxed"
          >
            {body}
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            fullWidth
          >
            {cancelLabel || t('admin.actions.cancel')}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'primary'}
            size="md"
            onClick={onConfirm}
            fullWidth
          >
            {confirmLabel || t('admin.actions.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
