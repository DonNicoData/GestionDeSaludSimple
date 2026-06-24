import { useTranslation } from 'react-i18next'
import type { Gender } from '@/types'

interface SegmentedControlProps<T extends string> {
  name: string
  options: { value: T; label: string }[]
  value: T | undefined
  onChange: (value: T) => void
  ariaLabel?: string
}

/**
 * Selector segmentado de 2 opciones (estilo iOS).
 * Usado para género (Mujer / Hombre).
 */
export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-cols-2 gap-1 p-1 bg-divider rounded-2xl"
    >
      {options.map((opt) => {
        const selected = value === opt.value
        const inputId = `${name}-${opt.value}`
        return (
          <label
            key={opt.value}
            htmlFor={inputId}
            className={[
              'flex items-center justify-center cursor-pointer rounded-xl h-11 font-medium transition-all select-none',
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
            {opt.label}
          </label>
        )
      })}
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
    <div
      className={error ? 'rounded-2xl ring-2 ring-alert/40 p-1' : ''}
    >
      <SegmentedControl<Gender>
        name="gender"
        options={options}
        value={value}
        onChange={onChange}
        ariaLabel={t('basicForm.fields.gender.label')}
      />
    </div>
  )
}
