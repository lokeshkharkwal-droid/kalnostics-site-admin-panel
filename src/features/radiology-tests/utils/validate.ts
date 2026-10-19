import type { RadiologyTest } from '../interfaces'

/**
 * Client-side validation mirroring the backend's radiology-test invariants.
 * Returns the first human-readable error, or null when valid. The backend stays
 * the source of truth — this just catches the obvious cases before a round-trip.
 */
export function validateRadiologyTest(t: RadiologyTest): string | null {
  if (!t.testName.trim()) return 'Test Name is required'
  if (t.testName.trim().length < 2) return 'Test Name must be at least 2 characters'
  if (!t.testCode.trim()) return 'Test Code is required'

  // Price ladder: minimum ≤ maximum ≤ MSRP (only checked where values are set).
  if (t.priceMax > 0 && t.priceMin > t.priceMax) return 'Price Minimum cannot exceed Price Maximum'
  if (t.priceMSRP > 0 && t.priceMax > t.priceMSRP) return 'Price Maximum cannot exceed Price MSRP'
  if (t.priceMSRP > 0 && t.priceMin > t.priceMSRP) return 'Price Minimum cannot exceed Price MSRP'

  // Discount cap is a percentage.
  if (t.discountCap < 0 || t.discountCap > 100) return 'Discount Cap % must be between 0 and 100'

  return null
}
