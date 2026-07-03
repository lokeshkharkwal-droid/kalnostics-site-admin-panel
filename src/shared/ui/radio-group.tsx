'use client'

import { cn } from '@/shared/utils'
import { Label } from './form-controls'

export interface RadioOption<T extends string> {
  value: T
  label: string
}

interface RadioGroupProps<T extends string> {
  label?: string
  options: RadioOption<T>[]
  value: T
  onChange: (value: T) => void
  name: string
  disabled?: boolean
  className?: string
}

/**
 * Horizontal radio group used for Yes/No and Exclusive/Inclusive choices.
 * Controlled — `value`/`onChange` own the state.
 */
export function RadioGroup<T extends string>({
  label, options, value, onChange, name, disabled, className,
}: RadioGroupProps<T>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 text-sm text-notion-text',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
              className="h-3.5 w-3.5 accent-notion-blue"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}
