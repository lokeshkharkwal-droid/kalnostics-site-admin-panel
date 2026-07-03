'use client'

import { useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/shared/utils'
import { Button } from './button'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

/* ═══════════════════════════════════════
   DATA TABLE
   One config-driven table for the whole Site Admin app. Columns are declared as
   data (header + cell render fn); the component owns the chrome: a premium glass
   card over a soft gradient, gradient uppercase header, zebra rows, resizable
   columns, ellipsis truncation with an overflow-aware hover tooltip, an optional
   Actions column that reveals on row hover, row-click, pagination, and subtle
   Framer Motion entrance/hover animations. See any *Grid / *Table for usage.
═══════════════════════════════════════ */

export interface Column<T> {
  /** Stable id for width state + React keys. Defaults to the header text. */
  id?: string
  header: ReactNode
  /** Render the cell. `index` is page-aware (`startIndex + rowIndex`). */
  cell: (row: T, index: number) => ReactNode
  align?: 'left' | 'right' | 'center'
  /** Initial column width in px (table uses a fixed layout). */
  width?: number
  /** Resize floor in px. Default 48. */
  minWidth?: number
  /** Allow drag-resize. Default true. */
  resizable?: boolean
  /** One-line + ellipsis + hover tooltip. Default true. Set false for badges/stacked cells. */
  truncate?: boolean
  /** Explicit tooltip text — needed when the cell renders non-string content. */
  tooltip?: (row: T) => string
  headerClassName?: string
  cellClassName?: string
}

export interface TablePagination {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  emptyMessage?: string
  /** Page-aware base index for S.No-style columns. Default 0. */
  startIndex?: number
  /** Renders a right-most Actions column when provided. */
  actions?: (row: T) => ReactNode
  actionsHeader?: ReactNode
  /** Width of the Actions column in px. Default 160. */
  actionsWidth?: number
  onRowClick?: (row: T) => void
  pagination?: TablePagination
  /** Render the gradient backdrop + glass card chrome. Default true. Set false
   *  when embedding the table inside another card (e.g. the dashboard). */
  frame?: boolean
  className?: string
}

const ACTIONS_ID = '__actions__'
const DEFAULT_WIDTH = 180
const DEFAULT_MIN = 48
const alignClass = (a?: 'left' | 'right' | 'center') =>
  a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

/**
 * A cell that clips overflowing text with an ellipsis and reveals the full value
 * in a small floating tooltip — but only when the text is actually truncated.
 */
function TruncatedCell({ children, tooltip }: { children: ReactNode; tooltip?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  const tip = tooltip ?? (typeof children === 'string' ? children : undefined)

  function handleEnter() {
    const el = ref.current
    if (el) setOverflowing(el.scrollWidth > el.clientWidth)
    setShow(true)
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      <div ref={ref} className="truncate">{children}</div>
      <AnimatePresence>
        {show && overflowing && tip && (
          <motion.div
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute left-0 top-full z-50 mt-1 max-w-xs whitespace-normal break-words rounded-lg border border-notion-line2 bg-white px-2.5 py-1.5 text-xs text-notion-text shadow-soft"
          >
            {tip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DataTable<T>({
  columns, rows, rowKey, loading, emptyMessage = 'No records found',
  startIndex = 0, actions, actionsHeader = 'Actions', actionsWidth = 160,
  onRowClick, pagination, frame = true, className,
}: DataTableProps<T>) {
  const reduce = useReducedMotion()
  const colId = (c: Column<T>) => c.id ?? (typeof c.header === 'string' ? c.header : '')

  // Width state, keyed by column id (+ the synthetic actions column).
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    columns.forEach(c => { init[colId(c)] = c.width ?? DEFAULT_WIDTH })
    if (actions) init[ACTIONS_ID] = actionsWidth
    return init
  })

  function startResize(e: React.PointerEvent, id: string, min: number) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = widths[id] ?? DEFAULT_WIDTH
    const onMove = (ev: PointerEvent) =>
      setWidths(w => ({ ...w, [id]: Math.max(min, startW + ev.clientX - startX) }))
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const totalColumns = columns.length + (actions ? 1 : 0)
  const totalWidth =
    columns.reduce((sum, c) => sum + (widths[colId(c)] ?? DEFAULT_WIDTH), 0) +
    (actions ? widths[ACTIONS_ID] ?? actionsWidth : 0)

  // Re-mounting the body whenever the data set changes replays the stagger.
  const bodyKey = rows.map(rowKey).join('|')

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.025 } },
  }
  const rowVariants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' as const } },
  }

  const table = (
    <div className="no-scrollbar overflow-x-auto">
      <table
        className="border-collapse text-sm"
        style={{ tableLayout: 'fixed', width: totalWidth, minWidth: '100%' }}
      >
        <colgroup>
          {columns.map(c => <col key={colId(c)} style={{ width: widths[colId(c)] }} />)}
          {actions && <col style={{ width: widths[ACTIONS_ID] }} />}
        </colgroup>

        <thead>
          <tr className="border-b border-notion-line bg-gradient-to-b from-notion-panel to-white text-notion-sub">
            {columns.map(c => {
              const id = colId(c)
              const resizable = c.resizable ?? true
              return (
                <th
                  key={id}
                  className={cn(
                    'relative px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider',
                    alignClass(c.align), c.headerClassName,
                  )}
                >
                  <span className="block truncate">{c.header}</span>
                  {resizable && (
                    <span
                      onPointerDown={e => startResize(e, id, c.minWidth ?? DEFAULT_MIN)}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none transition-colors hover:bg-notion-blue/40"
                    />
                  )}
                </th>
              )
            })}
            {actions && (
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">{actionsHeader}</th>
            )}
          </tr>
        </thead>

        {rows.length > 0 && (
          <motion.tbody key={bodyKey} variants={containerVariants} initial="hidden" animate="show">
            {rows.map((row, i) => (
              <motion.tr
                key={rowKey(row)}
                variants={rowVariants}
                whileHover={reduce ? undefined : { y: -1 }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'group relative transform-gpu border-b border-notion-line/70 transition-colors last:border-0',
                  'even:bg-notion-panel/40',
                  'hover:bg-blue-50/50 hover:shadow-[inset_2px_0_0_0_#2383e2,0_6px_16px_-8px_rgba(35,131,226,0.35)]',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map(c => {
                  const content = c.cell(row, startIndex + i)
                  const truncate = c.truncate ?? true
                  return (
                    <td
                      key={colId(c)}
                      className={cn('px-4 py-2.5 align-middle text-notion-text', alignClass(c.align), c.cellClassName)}
                    >
                      {truncate
                        ? <TruncatedCell tooltip={c.tooltip?.(row)}>{content}</TruncatedCell>
                        : content}
                    </td>
                  )
                })}
                {actions && (
                  <td className="whitespace-nowrap px-4 py-2.5" onClick={e => e.stopPropagation()}>
                    {/* Visible by default; on hover-capable (pointer) devices it
                        hides at rest and fades in on row hover. Always visible on touch. */}
                    <div className="flex items-center transition-opacity duration-200 [@media(hover:hover)]:opacity-0 group-hover:[@media(hover:hover)]:opacity-100 [&:has([aria-expanded=true])]:opacity-100">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </motion.tbody>
        )}

        {rows.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={totalColumns} className="py-16 text-center text-sm text-notion-faint">
                {loading ? 'Loading…' : emptyMessage}
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  )

  const footer = pagination && pagination.totalPages > 1 && (
    <div className="flex flex-col gap-3 border-t border-notion-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-notion-sub">
        Showing {(pagination.page - 1) * pagination.limit + 1}–
        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary" size="sm"
          disabled={pagination.page === 1}
          onClick={() => pagination.onPageChange(pagination.page - 1)}
        >
          <ChevronLeftIcon className="h-4 w-4" /> Prev
        </Button>
        <span className="px-1 text-xs font-medium text-notion-sub">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <Button
          variant="secondary" size="sm"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => pagination.onPageChange(pagination.page + 1)}
        >
          Next <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  // Embedded mode: no gradient/glass chrome — sits inside a parent card.
  if (!frame) {
    return (
      <div className={cn('overflow-hidden', className)}>
        {table}
        {footer}
      </div>
    )
  }

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br from-notion-panel via-white to-blue-50/30 p-2 sm:p-3', className)}>
      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-soft backdrop-blur-xl">
        {table}
        {footer}
      </div>
    </div>
  )
}
