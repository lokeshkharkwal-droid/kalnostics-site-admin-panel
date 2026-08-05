import type { LabTestListRow, LabTestListView } from '@/entities/lab-test'

/* ═══════════════════════════════════════
   Rich UI Lab Test model (string-based).
   The form edits this shape; it is mapped to/from the backend DTO/entity in
   ../utils/mapping.ts. Fields that don't apply to a SITE_ADMIN template
   (Department / Category / Sub Category / Mandatory Test / Report Template /
   PDF / Image / Approval Workflow / Group & Icon Settings / Version Control)
   are deliberately omitted from the form and from this model.
═══════════════════════════════════════ */

export interface SampleItem {
  id: string
  sampleName: string
  sampleType: string
  containerType: string
  sampleSize: string
  collectionMethod: string
  fastingRequired: boolean
  numberOfSamples: number
  stability: string
  lightProtection: boolean
  preservative: string
  transportTemp: string
  handlingInstructions: string
  isDefault: boolean
}

export interface ResultItem {
  id: string
  groupName: string
  groupLayout: string
  parameterName: string
  /** Backend-required machine code for the parameter (e.g. "HGB"). */
  parameterCode: string
  method: string
  nabl: boolean
  cap: boolean
  parameterType: string
  resultEntryMode: string
  calculationFormula: string
  reportingUnit: string
  resultRounding: string
  allowableUnits?: string
  decimalPlaces: number
  resultType: string
  /** Reflex tests reference existing lab tests by id; name is for display. */
  reflexTests: { id: string; name: string }[]
  criticalValueMin: string
  criticalValueMax: string
  notes: string
  isDefault: boolean
}

export interface ReferenceRangeItem {
  id: string
  parameter: string
  method: string
  gender: string
  ageFrom: string
  ageFromUnit: string
  ageTo: string
  ageToUnit: string
  lowerLimit: string
  upperLimit: string
  criticalMin: string
  criticalMax: string
  displayRange: string
  abnormalFlagLogic: string
  isDefault: boolean
}

export interface ReferenceValueItem {
  id: string
  parameter: string
  method: string
  gender: string
  ageFrom: string
  ageFromUnit: string
  ageTo: string
  ageToUnit: string
  displayRange: string
  abnormalFlagLogic: string
  isDefault: boolean
}

export interface LabTest {
  id: string
  testName: string
  testDisplay: string
  testCode: string
  aka: string
  processMethod: string
  hideInOrderScreen: boolean
  clinicalTags: string
  icdCode: string
  loincCode: string
  samplePriorityType: string
  enable: boolean
  repeatIntervalRestriction: boolean
  intervalDuration: string
  intervalUnit: string
  // Pricing
  priceMSRP: number
  priceMax: number
  priceMin: number
  priceOriginal: number
  franchisePrice: number
  emergencyPrice: number
  allowPriceOverride: boolean
  discountCap: number
  // TAT
  tatMin: number
  tatMinUnit: string
  tatMax: number
  tatMaxUnit: string
  scheduleDays: string[]
  scheduleTimeFrom: string
  scheduleTimeTo: string
  processingTimeFrom: string
  processingTimeTo: string
  approvalTimeFrom: string
  approvalTimeTo: string
  procTimeMin: number
  procTimeMinUnit: string
  procTimeMax: number
  procTimeMaxUnit: string
  // Flags
  billOnlyTest: boolean
  isAllowDiscounts: boolean
  outsource: boolean
  preferredTest: boolean
  sampleFlow: boolean
  testStatus: string
  // Sub-sections
  samples: SampleItem[]
  results: ResultItem[]
  referenceRanges: ReferenceRangeItem[]
  referenceValues: ReferenceValueItem[]
  // Notes
  usefulFor: string
  interpretation: string
  limitations: string
  remarks: string
  references: string
}

/* ─── List query / result ─── */
export type StatusFilter = '' | 'ACTIVE' | 'INACTIVE'

export interface ListLabTestsParams {
  page?: number
  limit?: number
  search?: string
  status?: StatusFilter
  view?: LabTestListView
}

export interface ListLabTestsResult {
  rows: LabTestListRow[]
  total: number
  totalPages: number
  /** The view the returned rows were projected for (drives the grid columns). */
  view: LabTestListView
}
