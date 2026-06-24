import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface FormFieldProps {
  id: string
  label: string
  help?: string
  errorKey?: string | null
  required?: boolean
  children: ReactNode
}

export function FormField({
  id,
  label,
  help,
  errorKey,
  required,
  children,
}: FormFieldProps) {
  const { t } = useTranslation()
  const errorMessage = errorKey ? t(`basicForm.errors.${errorKey}`) : null
  const helpId = help ? `${id}-help` : undefined
  const errorId = errorMessage ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-2">
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

      <div
        aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
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
          className="text-xs text-alert font-medium leading-relaxed"
        >
          {errorMessage}
        </p>
      )}
    </div>
  )
}
