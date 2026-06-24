import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

export type InputState = 'neutral' | 'error' | 'valid'

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'date' | 'email'
  suffix?: ReactNode
  state?: InputState
}

const baseClasses =
  'w-full h-12 px-4 text-base bg-white border-2 rounded-2xl transition-colors focus:outline-none disabled:bg-divider disabled:text-graphite/50'

const stateClasses: Record<InputState, string> = {
  neutral:
    'border-divider focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
  error:
    'border-alert focus:border-alert focus-visible:ring-2 focus-visible:ring-alert focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
  valid:
    'border-primary focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      value,
      onChange,
      type = 'text',
      suffix,
      state = 'neutral',
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
          className={[baseClasses, stateClasses[state], suffix ? 'pr-12' : '', className]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={state === 'error' ? true : undefined}
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
