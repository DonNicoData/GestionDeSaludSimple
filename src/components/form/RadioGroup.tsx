import { ReactNode } from 'react'

interface RadioGroupOption<T extends string> {
  value: T
  label: string
  description?: string
}

interface RadioGroupProps<T extends string> {
  name: string
  options: RadioGroupOption<T>[]
  value: T | undefined
  onChange: (value: T) => void
  error?: boolean
  ariaLabel?: string
}

/**
 * RadioGroup en formato de cards horizontales (segmented).
 * Cada opción es un botón con label + descripción opcional.
 * Toca-friendly: mínimo 44px de alto.
 */
export function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  error = false,
  ariaLabel,
}: RadioGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
    >
      {options.map((opt) => {
        const selected = value === opt.value
        const inputId = `${name}-${opt.value}`
        const card = (
          <label
            htmlFor={inputId}
            className={[
              'relative flex flex-col items-center justify-center text-center cursor-pointer rounded-2xl border-2 px-4 py-3 min-h-[56px] transition-all',
              selected
                ? 'border-primary bg-primary-soft/40 shadow-soft'
                : error
                  ? 'border-alert/50 bg-white hover:border-alert'
                  : 'border-divider bg-white hover:border-primary-soft',
            ].join(' ')}
          >
            <input
              id={inputId}
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              className={[
                'font-semibold text-base',
                selected ? 'text-primary-dark' : 'text-graphite',
              ].join(' ')}
            >
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-xs text-graphite/60 mt-1 leading-snug">
                {opt.description}
              </span>
            )}
          </label>
        )
        return <div key={opt.value}>{card as ReactNode}</div>
      })}
    </div>
  )
}
