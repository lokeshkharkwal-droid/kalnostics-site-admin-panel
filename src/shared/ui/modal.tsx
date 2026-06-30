'use client'

import { cn } from '@/shared/utils'

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
}

/** Generic centered modal (fixed-overlay) with header, scrollable body and footer. */
export function Modal({
  title, onClose, children, footer, size = 'md',
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: keyof typeof WIDTHS
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className={cn('flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-notion-line bg-white shadow-xl', WIDTHS[size])}>
        <div className="flex shrink-0 items-center justify-between border-b border-notion-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-notion-text">{title}</h2>
          <button onClick={onClose} className="text-notion-faint transition-colors hover:text-notion-sub" aria-label="Close">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-notion-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
