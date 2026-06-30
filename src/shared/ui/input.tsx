import { cn } from '@/shared/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-notion-sub">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-8 w-full rounded-md border bg-white px-2.5 text-sm text-notion-text',
            'placeholder:text-notion-faint',
            'focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue',
            'transition-colors duration-150',
            error
              ? 'border-notion-red/60 focus:ring-notion-red/30 focus:border-notion-red'
              : 'border-notion-line2',
            props.disabled && 'bg-notion-panel cursor-not-allowed opacity-60',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-notion-red">{error}</p>}
        {hint && !error && <p className="text-xs text-notion-faint">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
