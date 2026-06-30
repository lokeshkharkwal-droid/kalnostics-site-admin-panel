import { cn } from '@/shared/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

// Notion-inspired buttons: flat, hairline-bordered, one blue primary.
const variants = {
  primary:   'bg-notion-blue text-white hover:bg-notion-bluedk shadow-sm focus:ring-notion-blue/40',
  secondary: 'bg-white text-notion-text border border-notion-line2 hover:bg-notion-hover focus:ring-notion-line2',
  danger:    'bg-notion-red text-white hover:brightness-95 focus:ring-notion-red/40',
  ghost:     'text-notion-sub hover:bg-notion-hover hover:text-notion-text focus:ring-notion-line2',
}

const sizes = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-sm',
  lg: 'h-9 px-4 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'transition-colors duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
