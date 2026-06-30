'use client'

import { cn } from '@/shared/utils'
import type { SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

/** Field label, matching the shared Input's label styling. */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('text-xs font-medium text-notion-sub', className)}>{children}</label>
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  placeholder?: string
}

/** Native <select> styled to match the Notion design tokens. */
export function SelectField({ label, options, value, onChange, placeholder, className, ...rest }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <Label>{label}</Label>}
      <select
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-8 w-full rounded-md border border-notion-line2 bg-white px-2 text-sm text-notion-text',
          'focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-notion-blue/30',
          'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function TextArea({ label, className, ...rest }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <Label>{label}</Label>}
      <textarea
        className={cn(
          'w-full rounded-md border border-notion-line2 bg-white px-2.5 py-1.5 text-sm text-notion-text',
          'placeholder:text-notion-faint',
          'focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-notion-blue/30',
          'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...rest}
      />
    </div>
  )
}
