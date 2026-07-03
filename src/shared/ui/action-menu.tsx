'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/utils'

export interface ActionMenuItem {
  label: string
  onClick: () => void
  /** `danger` renders the item in the destructive colour. */
  variant?: 'default' | 'danger'
}

/** Panel width floor — mirrors the `min-w-[10rem]` class (used before measure). */
const MENU_WIDTH = 160
const GAP = 4

/**
 * Three-dot (⋮) actions menu — a trigger button plus a popover of items.
 *
 * The popover is rendered in a **portal** to `document.body` with
 * `position: fixed`, positioned from the trigger's viewport rect. This escapes
 * every ancestor stacking context / `overflow` clip (each DataTable row is its
 * own `transform-gpu` stacking context, which previously painted the next row
 * on top of the menu and swallowed its clicks). Closes on outside click,
 * Escape, or scroll/resize. Styled with the Notion design tokens.
 */
export function ActionMenu({ items, label = 'Actions' }: { items: ActionMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Position the fixed panel from the trigger's rect, clamped to the viewport
  // (flips above the trigger when there's no room below). Runs in a layout
  // effect so the panel's measured size is applied before the browser paints.
  useLayoutEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const menu = menuRef.current
    const menuH = menu?.offsetHeight ?? 0
    const menuW = menu?.offsetWidth ?? MENU_WIDTH

    let top = rect.bottom + GAP
    if (top + menuH > window.innerHeight - GAP && rect.top - GAP - menuH > 0) {
      top = rect.top - GAP - menuH
    }
    let left = rect.right - menuW // right-aligned to the trigger
    left = Math.max(GAP, Math.min(left, window.innerWidth - menuW - GAP))
    setCoords({ top, left })
  }, [open])

  // Close on outside click (checking both the trigger and the portalled panel),
  // Escape, and any scroll/resize that would leave the fixed panel stale.
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
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

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setCoords(null); setOpen((o) => !o) }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-notion-sub transition-colors hover:bg-notion-hover hover:text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue/30"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {open && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords?.top ?? -9999, left: coords?.left ?? -9999 }}
            className={cn(
              'pointer-events-auto z-[1000] min-w-[10rem] overflow-hidden rounded-md border border-notion-line bg-white py-1 shadow-lg',
              coords ? 'opacity-100' : 'opacity-0',
            )}
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick() }}
                className={cn(
                  'block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-notion-hover',
                  item.variant === 'danger' ? 'text-notion-red' : 'text-notion-text',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
