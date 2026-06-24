import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'date' | 'email'
  suffix?: ReactNode
  error?: boolean
}

const baseClasses =
  'w-full h-12 px-4 text-base bg-white border-2 rounded-2xl transition-colors focus:outline-none focus:border-primary disabled:bg-divider disabled:text-graphite/50'

const stateClasses = {
  normal: 'border-divider focus:border-primary',
  error: 'border-alert focus:border-alert',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      value,
      onChange,
      type = 'text',
      suffix,
      error = false,
      className = '',
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={[
            baseClasses,
            error ? stateClasses.error : stateClasses.normal,
            suffix ? 'pr-12' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {suffix && (
          <span
            aria-hidden="true"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-graphite/50 text-sm pointer-events-none select-none"
          >
            {suffix}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
