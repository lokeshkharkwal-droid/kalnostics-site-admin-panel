/* ══════════════════════════════════════════
   AGE-BOUND VALIDATION (calendar-aware), ported from the business FE (kaltros-fe
   src/utils/age-bounds.ts). Used by the lab-test Age Restriction check.

   Mirrors the backend rule (Kalnostic-new `common/utils/age-bounds.util.ts`) so the
   form rejects exactly what the backend would — and accepts everything it accepts.

   Age From and Age To are each a number plus a unit (Days / Months / Years) and may use
   different units ('15 Days' to '1 Year'). Months and years have variable length, so the
   two bounds are compared on the calendar, never as raw numbers or fixed day counts.

   Rule: both ends are inclusive and the 'To' bound covers its WHOLE unit. For a baby
   born on DOB the range covers every date x with
       DOB + From  <=  x  <  DOB + (To + 1 unit)
   so '1 Month to 11 Months' includes a patient aged 11 months 20 days. A range is valid
   when that span is non-empty for every possible birth date. Month arithmetic clamps to
   the last day of the month (31 Jan + 1 month = 28/29 Feb).

   Keep in sync with the backend; both are tested against the same cases.
══════════════════════════════════════════ */

export type AgeUnitLabel = 'Days' | 'Months' | 'Years'

export interface AgeBound {
  value: number
  unit: AgeUnitLabel
}

interface Ymd { y: number; m: number; d: number }

const MS_PER_DAY = 86_400_000

const daysInMonth = (y: number, m: number): number => new Date(Date.UTC(y, m, 0)).getUTCDate()

const toDayNumber = ({ y, m, d }: Ymd): number => Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY)

/** Add an age bound to a birth date on the calendar; returns days since 1970-01-01. */
export function addAgeBound(dob: Ymd, bound: AgeBound): number {
  switch (bound.unit) {
    case 'Days':
      return toDayNumber(dob) + bound.value
    case 'Months': {
      const index = dob.y * 12 + (dob.m - 1) + bound.value
      const y = Math.floor(index / 12)
      const m = (index % 12) + 1
      return toDayNumber({ y, m, d: Math.min(dob.d, daysInMonth(y, m)) })
    }
    case 'Years': {
      const y = dob.y + bound.value
      return toDayNumber({ y, m: dob.m, d: Math.min(dob.d, daysInMonth(y, dob.m)) })
    }
  }
}

/** One full 4-year calendar cycle containing a leap day (2024-01-01 .. 2027-12-31). */
const REFERENCE_DOBS: readonly Ymd[] = (() => {
  const dates: Ymd[] = []
  for (let y = 2024; y <= 2027; y++) {
    for (let m = 1; m <= 12; m++) {
      const last = daysInMonth(y, m)
      for (let d = 1; d <= last; d++) dates.push({ y, m, d })
    }
  }
  return dates
})()

const validityCache = new Map<string, boolean>()

/** True when `from .. to` is non-empty for every birth date ('To' covers its whole unit). */
export function isAgeRangeValid(from: AgeBound, to: AgeBound): boolean {
  const key = `${from.value}${from.unit}|${to.value}${to.unit}`
  const cached = validityCache.get(key)
  if (cached !== undefined) return cached
  const upper: AgeBound = { value: to.value + 1, unit: to.unit }
  const valid = REFERENCE_DOBS.every((dob) => addAgeBound(dob, from) < addAgeBound(dob, upper))
  validityCache.set(key, valid)
  return valid
}

