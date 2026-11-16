import { isAgeRangeValid, type AgeUnitLabel } from '@/shared/utils/age-bounds'
import type { AgeRestrictionValue } from '../interfaces'

/* ══════════════════════════════════════════
   LAB TEST AGE RESTRICTION — form validation (Basic Details).
   Mirrors the backend rule (Kalnostic-new lab-test `resolveAgeRestriction`):
   when on, both bounds are required whole numbers 0–999 and Minimum Age must
   not be greater than Maximum Age on the calendar (the max covers its whole
   unit, so "18 Years – 18 Years" is valid). Off = no age limit.
══════════════════════════════════════════ */

/** Largest age value the backend accepts for a bound. */
export const MAX_AGE_VALUE = 999

const asUnit = (unit: string): AgeUnitLabel =>
  unit === 'Days' || unit === 'Months' ? unit : 'Years'

/** A bound typed in the form as a whole number 0–999, else `null`. */
function parseAge(raw: string): number | null {
  const s = raw.trim()
  if (!/^\d+$/.test(s)) return null
  const n = Number(s)
  return n <= MAX_AGE_VALUE ? n : null
}

/**
 * Validate a test's Age Restriction as the form holds it.
 * @returns an error message, or `null` when valid (always `null` while Age Restriction is No)
 */
export function validateAgeRestriction(v: AgeRestrictionValue): string | null {
  if (!v.ageRestriction) return null
  if (!v.minAge.trim() || !v.maxAge.trim()) {
    return 'Minimum Age and Maximum Age are required when Age Restriction is Yes.'
  }
  const min = parseAge(v.minAge)
  const max = parseAge(v.maxAge)
  if (min === null || max === null) {
    return `Ages must be whole numbers from 0 to ${MAX_AGE_VALUE}.`
  }
  if (!isAgeRangeValid({ value: min, unit: asUnit(v.minAgeUnit) }, { value: max, unit: asUnit(v.maxAgeUnit) })) {
    return 'Minimum Age must not be greater than Maximum Age.'
  }
  return null
}
