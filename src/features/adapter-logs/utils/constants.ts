import type { AdapterActionValue } from '../interfaces'

/** Page size for the adapter-log list. */
export const ADAPTER_LOGS_PAGE_LIMIT = 20

/** Action filter options (mirrors the backend `AdapterAction` enum). */
export const ACTION_OPTIONS: { value: AdapterActionValue; label: string }[] = [
  { value: 'ORDERS', label: 'Orders' },
  { value: 'SUBMIT_RESULT', label: 'Submit Result' },
  { value: 'OTHER', label: 'Other' },
]

/** Humanized action label, keyed by the backend enum value. */
export const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  ACTION_OPTIONS.map((o) => [o.value, o.label]),
)

/** Badge variant per action. */
export const ACTION_VARIANT: Record<
  AdapterActionValue,
  'success' | 'info' | 'warning' | 'default'
> = {
  ORDERS: 'info',
  SUBMIT_RESULT: 'success',
  OTHER: 'default',
}

/** Badge variant per (upper-cased) textual status. */
export function statusVariant(
  status: string | null,
): 'success' | 'danger' | 'warning' | 'default' {
  switch ((status ?? '').toUpperCase()) {
    case 'SUCCESS':
      return 'success'
    case 'FAILED':
    case 'ERROR':
      return 'danger'
    case 'PENDING':
    case 'WARNING':
      return 'warning'
    default:
      return 'default'
  }
}

/** Format an ISO timestamp as a compact, locale-aware date + time. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Pretty-print a raw request/response payload as JSON when possible. */
export function formatPayload(raw: string | null): string {
  if (!raw) return '—'
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}
