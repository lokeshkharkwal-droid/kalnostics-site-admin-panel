'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/shared/utils'
import { CloseIcon } from './icons'

/**
 * Right-side slide-over panel — a lighter-weight sibling of `Modal` for
 * auxiliary controls (e.g. a column-visibility picker) that shouldn't block
 * the whole screen. Stacks above `Modal` (z-[70] vs. z-[60]).
 */
export function Sheet({
  open, onClose, title, children, widthClassName = 'w-[360px]',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  widthClassName?: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'absolute inset-y-0 right-0 flex h-full flex-col border-l border-notion-line bg-white shadow-xl',
              widthClassName,
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-notion-line px-5 py-3.5">
              <h2 className="text-sm font-semibold text-notion-text">{title}</h2>
              <button onClick={onClose} className="text-notion-faint transition-colors hover:text-notion-sub" aria-label="Close">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
