import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import type { Gender } from '@/types'

interface SegmentedControlOption<T extends string> {
  value: T
  label: string
  /** Texto opcional debajo del icono (1 línea corta). */
  description?: string
  /** Imagen/icono opcional entre label y descripción. */
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  name: string
  options: SegmentedControlOption<T>[]
  value: T | undefined
  onChange: (value: T) => void
  ariaLabel?: string
  /** Marca error (anillo rojo alrededor del contenedor). */
  error?: boolean
}

/**
 * Selector segmentado estilo iOS.
 * Acepta N opciones; cada opción puede llevar (en este orden):
 *   1. label (siempre presente)
 *   2. icono (opcional, en el medio)
 *   3. descripción (opcional, debajo del icono)
 * Usado para género (2 opciones) y contextura de muñeca (3 opciones
 * con icono + descripción).
 */
export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  ariaLabel,
  error = false,
}: SegmentedControlProps<T>) {
  const cols = options.length
  return (
    <div
      className={error ? 'rounded-2xl ring-2 ring-alert/40 p-1' : ''}
    >
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="grid gap-1 p-1 bg-divider rounded-2xl"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const selected = value === opt.value
          const inputId = `${name}-${opt.value}`
          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={[
                'flex flex-col items-center justify-center cursor-pointer rounded-xl px-2 py-2.5 font-medium transition-all select-none text-center gap-1',
                selected
                  ? 'bg-white shadow-soft text-primary-dark'
                  : 'text-graphite/60 hover:text-graphite',
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
              <span className="text-sm font-semibold leading-tight">
                {opt.label}
              </span>
              {opt.icon && (
                <span className="block h-12 w-full max-w-[88px] pointer-events-none">
                  {opt.icon}
                </span>
              )}
              {opt.description && (
                <span
                  className={[
                    'text-[11px] leading-tight',
                    selected ? 'text-graphite/60' : 'text-graphite/50',
                  ].join(' ')}
                >
                  {opt.description}
                </span>
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function GenderField({
  value,
  onChange,
  error,
}: {
  value: Gender | undefined
  onChange: (v: Gender) => void
  error?: boolean
}) {
  const { t } = useTranslation()
  const options: { value: Gender; label: string }[] = [
    { value: 'F', label: t('basicForm.fields.gender.options.F') },
    { value: 'M', label: t('basicForm.fields.gender.options.M') },
  ]
  return (
    <SegmentedControl<Gender>
      name="gender"
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel={t('basicForm.fields.gender.label')}
      error={error}
    />
  )
}