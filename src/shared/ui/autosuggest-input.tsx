'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/utils'

const GAP = 4

/**
 * A free-text input with a portaled, filtered suggestion dropdown — unlike a
 * closed `<select>`, the user can type any value; suggestions are just a
 * convenience shortcut. The dropdown is rendered in a portal to `document.body`
 * (mirroring `ActionMenu`'s positioning/outside-click/Escape mechanics) so it
 * escapes any ancestor `overflow` clip, e.g. a `DataTable` cell.
 */
export function AutosuggestInput({
  label, value, onChange, suggestions, placeholder, disabled, className,
}: {
  label?: React.ReactNode
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = suggestions
    .filter(s => s.trim())
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .filter(s => !value.trim() || s.toLowerCase().includes(value.trim().toLowerCase()))
    .slice(0, 20)

  useLayoutEffect(() => {
    if (!open) return
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({ top: rect.bottom + GAP, left: rect.left, width: rect.width })
  }, [open, value])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (inputRef.current?.contains(t) || listRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const inputId = typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-notion-sub">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className={cn(
          'h-8 w-full rounded-md border border-notion-line2 bg-white px-2.5 text-sm text-notion-text',
          'placeholder:text-notion-faint',
          'focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue',
          'transition-colors duration-150',
          disabled && 'bg-notion-panel cursor-not-allowed opacity-60',
          className,
        )}
      />
      {open && !disabled && filtered.length > 0 && coords && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
            className="z-[80] max-h-44 overflow-y-auto rounded-md border border-notion-line2 bg-white py-1 shadow-lg"
          >
            {filtered.map(s => (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={s === value}
                onClick={() => { onChange(s); setOpen(false) }}
                className={cn(
                  'block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-notion-hover',
                  s === value ? 'bg-blue-50 text-notion-blue' : 'text-notion-text',
                )}
              >
                {s}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
