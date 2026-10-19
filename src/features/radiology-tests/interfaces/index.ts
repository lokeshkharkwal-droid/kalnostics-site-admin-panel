import type { RadiologyTestListRow, RadiologyTestListView } from '@/entities/radiology-test'

/* ═══════════════════════════════════════
   Rich UI Radiology Test model (string-based).
   The form edits this shape; it is mapped to/from the backend DTO/entity in
   ../utils/mapping.ts. Fields that don't apply to a SITE_ADMIN template
   (Department / Category / Sub Category / Report Template / Approval Workflow)
   are deliberately omitted from the form and from this model.

   The radiology model is FLAT: there are no samples, result parameters or
   reference ranges (those are lab-only).
═══════════════════════════════════════ */
export interface RadiologyTest {
  id: string
  // Identity
  testName: string
  testDisplay: string
  testCode: string
  aka: string
  // Radiology classification
  modality: string
  bodyPart: string
  view: string
  isContrast: boolean
  // Config
  hideInOrderScreen: boolean
  clinicalTags: string
  icdCode: string
  loincCode: string
  samplePriorityType: string
  enable: boolean
  // Pricing
  priceMSRP: number
  priceMax: number
  priceMin: number
  priceOriginal: number
  franchisePrice: number
  emergencyPrice: number
  commissionPrice: number
  allowPriceOverride: boolean
  discountCap: number
  isAllowDiscounts: boolean
  // TAT
  tatMin: number
  tatMinUnit: string
  tatMax: number
  tatMaxUnit: string
  // Schedule
  scheduleDays: string[]
  scheduleTimeFrom: string
  scheduleTimeTo: string
  // Flags
  billOnlyTest: boolean
  outsource: boolean
  preferredTest: boolean
  testStatus: string
  // Notes
  usefulFor: string
  interpretation: string
  limitations: string
  remarks: string
  references: string
  preparationInstructions: string
}

/* ─── List query / result ─── */
export type StatusFilter = '' | 'ACTIVE' | 'INACTIVE'
export type ModalityFilter = '' | string

export interface ListRadiologyTestsParams {
  page?: number
  limit?: number
  search?: string
  status?: StatusFilter
  modality?: ModalityFilter
  view?: RadiologyTestListView
}

export interface ListRadiologyTestsResult {
  rows: RadiologyTestListRow[]
  total: number
  totalPages: number
  /** The view the returned rows were projected for (drives the grid columns). */
  view: RadiologyTestListView
}
