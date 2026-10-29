import type { LabTestListRow, LabTestListView } from '@/entities/lab-test'

/* ═══════════════════════════════════════
   Rich UI Lab Test model (string-based).
   The form edits this shape; it is mapped to/from the backend DTO/entity in
   ../utils/mapping.ts. Only genuinely tenant-scoped fields (Department /
   Category / Sub Category / Mandatory Test / Report Template / PDF / Image /
   Group & Icon Settings / Lab Adapter scope / Version Control) are deliberately
   omitted — they reference per-tenant data that doesn't exist on a SITE_ADMIN
   global template. Non-tenant configuration (Approval Workflow, interval
   override, approval-duration / reporting windows, result suggestions / default
   value / overall-result groups, reference-range unit) is kept identical to the
   Business Admin "Create Lab Test" form so imported templates carry full config.
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
  /** Suggested values shown when entering this parameter's result (one per line in the UI). */
  resultSuggestions?: string[]
  /** Pre-filled value for this parameter's result — one of resultSuggestions or any custom text. */
  defaultValue?: string
  decimalPlaces: number
  resultType: string
  /** Reflex tests reference existing lab tests by id; name is for display. */
  reflexTests: { id: string; name: string }[]
  /** Overall Result template group names this parameter is linked to (free-text). */
  overallResultGroups: string[]
  criticalValueMin: string
  criticalValueMax: string
  notes: string
  isDefault: boolean
}

export interface ReferenceRangeItem {
  id: string
  parameter: string
  method: string
  unit: string
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
  approvalWorkflow: string
  hideInOrderScreen: boolean
  clinicalTags: string
  icdCode: string
  loincCode: string
  samplePriorityType: string
  enable: boolean
  repeatIntervalRestriction: boolean
  intervalDuration: string
  intervalUnit: string
  intervalOverrideAllowed: boolean
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
  reportingTimeFrom: string
  reportingTimeTo: string
  procTimeMin: number
  procTimeMinUnit: string
  procTimeMax: number
  procTimeMaxUnit: string
  // Approval duration — value + unit (maps to backend approvalDuration*Value/Unit)
  approvalTimeMin: number
  approvalTimeMinUnit: string
  approvalTimeMax: number
  approvalTimeMaxUnit: string
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
