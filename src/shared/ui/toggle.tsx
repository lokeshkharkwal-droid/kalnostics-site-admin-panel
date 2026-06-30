'use client'

import { cn } from '@/shared/utils'

/**
 * A small On/Off switch bound to a boolean. Used for the row status toggle and
 * the form's active flag.
 */
export function Toggle({
  checked, onChange, disabled, title, className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  title?: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-notion-blue/30 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-notion-blue' : 'bg-notion-line2',
        className,
      )}
    >
      <span className={cn('inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-3.5' : 'translate-x-0.5')} />
    </button>
  )
}
