import { cn } from '@/shared/utils'
import { InputHTMLAttributes, forwardRef, useState } from 'react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-notion-sub">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            disabled={disabled}
            className={cn(
              'h-8 w-full rounded-md border bg-white px-2.5 pr-9 text-sm text-notion-text',
              'placeholder:text-notion-faint',
              'focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue',
              'transition-colors duration-150',
              error
                ? 'border-notion-red/60 focus:ring-notion-red/30 focus:border-notion-red'
                : 'border-notion-line2',
              disabled && 'bg-notion-panel cursor-not-allowed opacity-60',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible(v => !v)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center px-2.5 text-notion-faint hover:text-notion-sub disabled:pointer-events-none"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            <EyeIcon open={visible} />
          </button>
        </div>
        {error && <p className="text-xs text-notion-red">{error}</p>}
        {hint && !error && <p className="text-xs text-notion-faint">{hint}</p>}
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
