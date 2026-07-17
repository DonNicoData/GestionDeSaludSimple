import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bone'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark shadow-soft hover:shadow-card',
  destructive:
    'bg-alert-dark text-white hover:bg-alert-darker shadow-soft hover:shadow-card',
  secondary:
    'bg-primary-soft text-primary-dark hover:bg-primary-soft/80',
  ghost:
    'bg-transparent text-graphite hover:bg-divider',
  outline:
    'bg-white border border-divider text-graphite hover:bg-bone hover:border-primary-soft hover:shadow-soft',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm min-w-[44px]',
  md: 'h-11 px-5 text-base min-w-[44px]',
  lg: 'h-14 px-7 text-lg min-w-[44px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className = '', ...props }, ref) => {
    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return <button ref={ref} className={classes} {...props} />
  },
)

Button.displayName = 'Button'
