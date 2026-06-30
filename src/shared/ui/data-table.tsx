'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/shared/utils'
import { Button } from './button'

/* ═══════════════════════════════════════
   DATA TABLE
   One config-driven table for the whole Site Admin app. Columns are declared as
   data (header + cell render fn); the component owns the chrome: a unified
   Notion-style header, resizable columns, ellipsis truncation with an
   overflow-aware hover tooltip, an optional sticky Actions column, row-click,
   and optional pagination. See any *Grid / *Table component for usage.
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
      {show && overflowing && tip && (
        <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 max-w-xs whitespace-normal break-words rounded-md border border-notion-line2 bg-white px-2 py-1 text-xs text-notion-text shadow-notion-lg">
          {tip}
        </div>
      )}
    </div>
  )
}

export function DataTable<T>({
  columns, rows, rowKey, loading, emptyMessage = 'No records found',
  startIndex = 0, actions, actionsHeader = 'Actions', actionsWidth = 160, onRowClick, pagination, className,
}: DataTableProps<T>) {
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

  return (
    <div className={cn('rounded-lg border border-notion-line bg-white', className)}>
      <div className="overflow-x-auto">
        <table
          className="border-collapse text-sm"
          style={{ tableLayout: 'fixed', width: totalWidth, minWidth: '100%' }}
        >
          <colgroup>
            {columns.map(c => <col key={colId(c)} style={{ width: widths[colId(c)] }} />)}
            {actions && <col style={{ width: widths[ACTIONS_ID] }} />}
          </colgroup>

          <thead>
            <tr className="border-b border-notion-line bg-notion-panel text-notion-sub">
              {columns.map(c => {
                const id = colId(c)
                const resizable = c.resizable ?? true
                return (
                  <th
                    key={id}
                    className={cn('relative px-3 py-2 font-medium', alignClass(c.align), c.headerClassName)}
                  >
                    <span className="block truncate">{c.header}</span>
                    {resizable && (
                      <span
                        onPointerDown={e => startResize(e, id, c.minWidth ?? DEFAULT_MIN)}
                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none hover:bg-notion-blue/30"
                      />
                    )}
                  </th>
                )
              })}
              {actions && (
                <th className="px-3 py-2 text-left font-medium">{actionsHeader}</th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-notion-line last:border-0 transition-colors hover:bg-notion-hover/40',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map(c => {
                  const content = c.cell(row, startIndex + i)
                  const truncate = c.truncate ?? true
                  return (
                    <td
                      key={colId(c)}
                      className={cn('px-3 py-1.5 align-middle', alignClass(c.align), c.cellClassName)}
                    >
                      {truncate
                        ? <TruncatedCell tooltip={c.tooltip?.(row)}>{content}</TruncatedCell>
                        : content}
                    </td>
                  )
                })}
                {actions && (
                  <td className="whitespace-nowrap px-3 py-1.5" onClick={e => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}

            {!loading && rows.length === 0 && (
              <tr><td colSpan={totalColumns} className="py-12 text-center text-notion-faint">{emptyMessage}</td></tr>
            )}
            {loading && (
              <tr><td colSpan={totalColumns} className="py-12 text-center text-notion-faint">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-notion-line px-3 py-3">
          <p className="text-xs text-notion-sub">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="secondary" size="sm"
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              ← Prev
            </Button>
            <Button
              variant="secondary" size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
