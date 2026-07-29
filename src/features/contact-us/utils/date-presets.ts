/**
 * Date-filter presets for the contact-us view. Each preset maps to inclusive
 * `from`/`to` bounds on `createdOn` that the backend accepts as ISO-8601 strings.
 * Day boundaries are computed in the user's local time, then serialised to ISO
 * (UTC) so the range reflects the local calendar day the user picked.
 *
 * (Adapted from `features/audit/utils/date-presets.ts`, with the extra
 * `MONTH_TO_DATE` and `YEAR_TO_DATE` presets.)
 */
export type DatePresetKey =
  | 'ALL'
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'MONTH_TO_DATE'
  | 'YEAR_TO_DATE'
  | 'PREVIOUS_MONTH'
  | 'SPECIFIC_DATE'
  | 'BEFORE'
  | 'AFTER'
  | 'RANGE'

export const DATE_PRESET_OPTIONS: { value: DatePresetKey; label: string }[] = [
  { value: 'ALL', label: 'All Dates' },
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { value: 'MONTH_TO_DATE', label: 'Month to Date' },
  { value: 'YEAR_TO_DATE', label: 'Year to Date' },
  { value: 'PREVIOUS_MONTH', label: 'Previous Month' },
  { value: 'SPECIFIC_DATE', label: 'Specific Date' },
  { value: 'BEFORE', label: 'All Dates Before' },
  { value: 'AFTER', label: 'All Dates After' },
  { value: 'RANGE', label: 'Date Range' },
]

/** How many `<input type="date">` fields a preset needs (0, 1, or 2). */
export function presetDateInputs(preset: DatePresetKey): 0 | 1 | 2 {
  switch (preset) {
    case 'SPECIFIC_DATE':
    case 'BEFORE':
    case 'AFTER':
      return 1
    case 'RANGE':
      return 2
    default:
      return 0
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** Parse a native date-input value (`yyyy-mm-dd`) as a local calendar date. */
function parseInputDate(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/**
 * Resolve a preset (+ any picked date inputs) into `{ from?, to? }` ISO bounds.
 * Returns an empty object when the selection is incomplete (e.g. a `RANGE` with
 * only one date), so the caller simply sends no date filter until it's valid.
 *
 * @param preset the selected preset
 * @param date the first date input (`yyyy-mm-dd`), used by Specific/Before/After/Range
 * @param dateTo the second date input (`yyyy-mm-dd`), used by Range only
 */
export function resolveDateRange(
  preset: DatePresetKey,
  date: string,
  dateTo: string,
): { from?: string; to?: string } {
  const now = new Date()

  switch (preset) {
    case 'ALL':
      return {}

    case 'TODAY':
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() }

    case 'YESTERDAY': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return { from: startOfDay(y).toISOString(), to: endOfDay(y).toISOString() }
    }

    case 'LAST_7_DAYS': {
      const start = new Date(now)
      start.setDate(start.getDate() - 6) // today + previous 6 days = 7 days
      return { from: startOfDay(start).toISOString(), to: endOfDay(now).toISOString() }
    }

    case 'MONTH_TO_DATE': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: startOfDay(start).toISOString(), to: endOfDay(now).toISOString() }
    }

    case 'YEAR_TO_DATE': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { from: startOfDay(start).toISOString(), to: endOfDay(now).toISOString() }
    }

    case 'PREVIOUS_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0) // day 0 = last day of prev month
      return { from: startOfDay(start).toISOString(), to: endOfDay(end).toISOString() }
    }

    case 'SPECIFIC_DATE': {
      const d = parseInputDate(date)
      if (!d) return {}
      return { from: startOfDay(d).toISOString(), to: endOfDay(d).toISOString() }
    }

    case 'BEFORE': {
      const d = parseInputDate(date)
      if (!d) return {}
      return { to: endOfDay(d).toISOString() } // on or before the selected date
    }

    case 'AFTER': {
      const d = parseInputDate(date)
      if (!d) return {}
      return { from: startOfDay(d).toISOString() } // on or after the selected date
    }

    case 'RANGE': {
      const start = parseInputDate(date)
      const end = parseInputDate(dateTo)
      if (!start || !end) return {}
      return { from: startOfDay(start).toISOString(), to: endOfDay(end).toISOString() }
    }

    default:
      return {}
  }
}
