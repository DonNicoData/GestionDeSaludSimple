import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

export type InputState = 'neutral' | 'error' | 'valid'

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'date' | 'email' | 'password'
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

/**
 * Whitelist para campos numéricos: solo dígitos + un separador decimal
 * (punto o coma) están permitidos. Acepta también estados parciales
 * como "12.", ".5", "" mientras se está escribiendo.
 */
const NUMERIC_REGEX = /^[\d]*([.,][\d]*)?$/

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
    const isNumeric = type === 'number'

    return (
      <div className="relative">
        <input
          ref={ref}
          type={isNumeric ? 'text' : type}
          inputMode={isNumeric || type === 'password' ? 'text' : undefined}
          value={value}
          onChange={(e) => {
            const raw = e.target.value
            // Para campos numéricos: silenciosamente rechazar caracteres no permitidos.
            // Esto elimina cualquier comportamiento nativo del navegador
            // (wheel, flechas, etc.) que pudiera cambiar el valor.
            if (isNumeric && raw !== '' && !NUMERIC_REGEX.test(raw)) {
              return
            }
            // Para campos numéricos: normalizar coma → punto al tipear.
            // El teclado iOS en LatAm (es-AR, es-MX, etc.) muestra ',' como
            // separador decimal por defecto; aceptar visualmente la coma pero
            // guardar punto en el state mantiene consistencia con el backend
            // y da feedback visual inmediato al usuario.
            const normalized = isNumeric ? raw.replace(',', '.') : raw
            onChange(normalized)
          }}
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
