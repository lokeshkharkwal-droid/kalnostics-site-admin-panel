'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { cn } from '@/shared/utils'
import { Badge } from './badge'

/* ═══════════════════════════════════════════════════════════════════════
   PaginatedSelect — a reusable, searchable, "Load More", API-backed select.
   Works in single- or multi-select mode (discriminated by `multiple`). Options
   load lazily when the panel opens and reset when the search term or any
   `queryKey` part changes (so it doubles as a cascading filter). Restyled into
   the Site Admin (notion) design system; modelled on the business-FE equivalent.
   ═══════════════════════════════════════════════════════════════════════ */

/** A selectable option. The label is carried alongside the id so the trigger
 *  (and multi chips) render correctly even before the option's page is loaded —
 *  e.g. when editing a record whose parent id came from the backend. */
export interface SelectOption {
  id: string
  label: string
}

/** One page from a paginated option API, in the backend's `{ data, meta }` shape. */
export interface PageResult {
  data: { id: string; name: string }[]
  meta: { page: number; totalPages: number }
}

interface BaseProps {
  /** react-query key parts identifying this list + its cascading filters. The
   *  search term and page size are appended internally. */
  queryKey: (string | number | undefined | null)[]
  /** Fetch one page for the given page number, search term and page size. */
  fetchPage: (params: { page: number; search: string; pageSize: number }) => Promise<PageResult>
  pageSize?: number
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  searchable?: boolean
  clearable?: boolean
}

interface SingleProps extends BaseProps {
  multiple?: false
  value: SelectOption | null
  onChange: (opt: SelectOption | null) => void
}

interface MultiProps extends BaseProps {
  multiple: true
  value: SelectOption[]
  onChange: (opts: SelectOption[]) => void
}

export type PaginatedSelectProps = SingleProps | MultiProps

/* ── inline icons (match the hand-rolled SVG approach used elsewhere) ── */
const ChevronDown = ({ open }: { open: boolean }) => (
  <svg className={cn('h-3.5 w-3.5 text-notion-faint transition-transform', open && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
)
const SearchSm = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-notion-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
)
const XSm = ({ className }: { className?: string }) => (
  <svg className={cn('h-3 w-3', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
)
const CheckSm = ({ className }: { className?: string }) => (
  <svg className={cn('h-3.5 w-3.5 shrink-0', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
)
const Spinner = () => (
  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
)

/**
 * A searchable single/multi select backed by a paginated option API.
 *
 * Options load lazily when the dropdown opens (and reset when the search term or
 * any `queryKey` part changes — used for cascading filters). The first
 * `pageSize` (default 10) options are shown; an explicit **Load More** button
 * appends the next page (no infinite scroll).
 *
 * - Single mode: `value` is `SelectOption | null`; picking an option closes the panel.
 * - Multi mode: `value` is `SelectOption[]`; picking toggles membership and keeps
 *   the panel open. Selected items render as removable chips.
 *
 * @param props discriminated by `multiple`.
 */
export function PaginatedSelect(props: PaginatedSelectProps) {
  const {
    queryKey,
    fetchPage,
    pageSize = 10,
    placeholder = 'Select…',
    emptyText = 'No options',
    disabled,
    className,
    searchable = true,
    clearable = true,
  } = props
  const multiple = props.multiple === true

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: [...queryKey, debounced, pageSize],
    queryFn: ({ pageParam }) => fetchPage({ page: pageParam, search: debounced, pageSize }),
    enabled: open,
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  })

  const options = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.data.map((o) => ({ id: o.id, label: o.name }))),
    [data],
  )

  const selectedIds = useMemo(() => {
    if (props.multiple) return new Set(props.value.map((o) => o.id))
    return new Set(props.value ? [props.value.id] : [])
  }, [props.multiple, props.value])

  const isSelected = (id: string) => selectedIds.has(id)

  function handlePick(opt: SelectOption) {
    if (props.multiple) {
      const exists = props.value.some((o) => o.id === opt.id)
      props.onChange(exists ? props.value.filter((o) => o.id !== opt.id) : [...props.value, opt])
    } else {
      props.onChange(opt)
      setOpen(false)
      setSearch('')
    }
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation()
    if (props.multiple) props.onChange([])
    else props.onChange(null)
  }

  function removeChip(id: string) {
    if (props.multiple) props.onChange(props.value.filter((o) => o.id !== id))
  }

  const multiValue = props.multiple ? props.value : []
  const singleValue = props.multiple ? null : props.value
  const hasSelection = multiple ? multiValue.length > 0 : !!singleValue

  const triggerLabel = multiple
    ? multiValue.length
      ? `${multiValue.length} selected`
      : placeholder
    : singleValue?.label || placeholder

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-notion-line2 bg-white px-2.5 text-sm hover:bg-notion-hover focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-notion-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={cn('truncate', hasSelection ? 'text-notion-text' : 'text-notion-faint')}>{triggerLabel}</span>
        <div className="flex shrink-0 items-center gap-1">
          {hasSelection && clearable && !disabled && (
            <span role="button" tabIndex={-1} onMouseDown={clearAll} className="cursor-pointer text-notion-faint hover:text-notion-red">
              <XSm />
            </span>
          )}
          <ChevronDown open={open} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[70] mt-1 min-w-[180px] rounded-md border border-notion-line2 bg-white shadow-lg">
          {searchable && (
            <div className="flex items-center gap-1.5 border-b border-notion-line px-2.5 py-1.5">
              <SearchSm />
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm text-notion-text outline-none placeholder:text-notion-faint"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto py-1">
            {isLoading ? (
              <p className="flex items-center justify-center gap-1.5 px-3 py-3 text-center text-xs text-notion-faint"><Spinner /> Loading…</p>
            ) : options.length === 0 ? (
              <p className="px-3 py-2 text-center text-xs text-notion-faint">{emptyText}</p>
            ) : (
              <>
                {options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handlePick(o) }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-notion-hover',
                      isSelected(o.id) && 'bg-blue-50 font-medium text-notion-blue',
                    )}
                  >
                    {multiple && <CheckSm className={isSelected(o.id) ? 'opacity-100' : 'opacity-0'} />}
                    <span className="truncate">{o.label}</span>
                  </button>
                ))}
                {hasNextPage && (
                  <button
                    type="button"
                    disabled={isFetchingNextPage}
                    onMouseDown={(e) => { e.preventDefault(); void fetchNextPage() }}
                    className="mt-1 flex w-full items-center justify-center gap-1.5 border-t border-notion-line px-3 py-1.5 text-center text-xs text-notion-blue transition-colors hover:bg-notion-hover disabled:opacity-50"
                  >
                    {isFetchingNextPage ? (<><Spinner /> Loading…</>) : 'Load More'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {multiple && multiValue.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {multiValue.map((o) => (
            <Badge key={o.id} variant="secondary" className="gap-1 normal-case">
              {o.label}
              {clearable && !disabled && (
                <button type="button" onClick={() => removeChip(o.id)} className="ml-0.5 rounded-full hover:text-notion-red">
                  <XSm />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
