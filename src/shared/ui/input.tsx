import { cn } from '@/shared/utils'
import { InputHTMLAttributes, forwardRef, useEffect, useState } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type, value, onChange, onFocus, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const isNumber = type === 'number'

    // For numeric fields we track a local draft string so the user can:
    //  - focus a `0` field and have it selected (typing replaces it, not `05`)
    //  - Backspace to empty and have it *stay* empty (rather than snapping to 0)
    // The draft is the source of truth while editing; a programmatic value
    // change (e.g. loading a record) wins via the effect below.
    const [draft, setDraft] = useState<string | null>(null)

    useEffect(() => {
      if (isNumber && draft !== null && Number(draft) !== Number(value)) {
        setDraft(null)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    // Keep the original value pass-through (incl. `undefined` for uncontrolled
    // inputs); only the draft overrides it, and only for numeric fields.
    const displayValue = isNumber && draft !== null ? draft : value

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (isNumber) setDraft(e.target.value)
      onChange?.(e)
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
      // Select the whole value so typing replaces a default `0` immediately.
      if (isNumber) e.currentTarget.select()
      onFocus?.(e)
    }

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
          type={type}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
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
