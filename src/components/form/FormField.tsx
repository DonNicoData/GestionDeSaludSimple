import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface FormFieldProps {
  id: string
  label: string
  help?: string
  errorKey?: string | null
  required?: boolean
  children: ReactNode
  counter?: { current: number; max: number }
  showCounter?: boolean
}

export function FormField({
  id,
  label,
  help,
  errorKey,
  required,
  children,
  counter,
  showCounter = false,
}: FormFieldProps) {
  const { t } = useTranslation()
  const errorMessage = errorKey ? t(`basicForm.errors.${errorKey}`) : null
  const helpId = help && !errorMessage ? `${id}-help` : undefined
  const errorId = errorMessage ? `${id}-error` : undefined
  const counterId = showCounter && counter ? `${id}-counter` : undefined

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-sm font-semibold text-graphite flex items-baseline gap-1"
        >
          <span>{label}</span>
          {required && (
            <span aria-hidden="true" className="text-alert">
              *
            </span>
          )}
        </label>
        {showCounter && counter && (
          <span
            id={counterId}
            aria-live="polite"
            className={[
              'text-xs tabular-nums',
              counter.current > counter.max
                ? 'text-alert font-semibold'
                : 'text-graphite/50',
            ].join(' ')}
          >
            {counter.current}/{counter.max}
          </span>
        )}
      </div>

      <div
        aria-describedby={[helpId, errorId, counterId].filter(Boolean).join(' ') || undefined}
        aria-invalid={errorMessage ? true : undefined}
      >
        {children}
      </div>

      {help && !errorMessage && (
        <p id={helpId} className="text-xs text-graphite/60 leading-relaxed">
          {help}
        </p>
      )}

      {errorMessage && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-xs text-alert font-medium leading-relaxed"
        >
          {errorMessage}
        </p>
      )}
    </div>
  )
}
