import type { LabTest } from '../interfaces'

const num = (s: string): number | null => {
  const t = s.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/**
 * Client-side validation mirroring the backend's lab-test invariants. Returns
 * the first human-readable error, or null when valid. The backend stays the
 * source of truth — this just catches the obvious cases before a round-trip.
 */
export function validateLabTest(t: LabTest): string | null {
  if (!t.testName.trim()) return 'Test Name is required'
  if (!t.testCode.trim()) return 'Test Code is required'

  // Price ladder: minimum ≤ maximum ≤ MSRP (only checked where values are set).
  if (t.priceMax > 0 && t.priceMin > t.priceMax) return 'Price Minimum cannot exceed Price Maximum'
  if (t.priceMSRP > 0 && t.priceMax > t.priceMSRP) return 'Price Maximum cannot exceed Price MSRP'
  if (t.priceMSRP > 0 && t.priceMin > t.priceMSRP) return 'Price Minimum cannot exceed Price MSRP'

  // Repeat interval restriction needs a value + unit.
  if (t.repeatIntervalRestriction) {
    const v = num(t.intervalDuration)
    if (v === null || v <= 0) return 'Repeat Interval value is required when Repeat Interval Restriction is on'
    if (!t.intervalUnit) return 'Interval Unit is required when Repeat Interval Restriction is on'
  }

  // Result parameters.
  for (const r of t.results) {
    if (!r.parameterName.trim()) return 'Every result parameter needs a Parameter Name'
    if (r.parameterType === 'Calculated' && !r.calculationFormula.trim()) {
      return `Calculated parameter "${r.parameterName}" needs a Calculation Formula`
    }
  }

  // Reference range bounds.
  for (const rr of t.referenceRanges) {
    const lo = num(rr.lowerLimit), hi = num(rr.upperLimit)
    const cMin = num(rr.criticalMin), cMax = num(rr.criticalMax)
    const aFrom = num(rr.ageFrom), aTo = num(rr.ageTo)
    const who = rr.parameter ? ` (${rr.parameter})` : ''
    if (lo !== null && hi !== null && lo > hi) return `Reference range${who}: Lower Limit cannot exceed Upper Limit`
    if (cMin !== null && lo !== null && cMin > lo) return `Reference range${who}: Critical Min cannot exceed Lower Limit`
    if (cMax !== null && hi !== null && cMax < hi) return `Reference range${who}: Critical Max cannot be below Upper Limit`
    if (aFrom !== null && aTo !== null && aFrom > aTo) return `Reference range${who}: Age From cannot exceed Age To`
  }

  return null
}
