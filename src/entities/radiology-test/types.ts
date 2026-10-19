/* ═══════════════════════════════════════════════════════════════════════
   Backend-facing Radiology Test contract (mirrors kalnostics-new radiology-test
   DTOs + the Prisma `RadiologyTest` model). The rich UI `RadiologyTest`
   (string-based) is mapped to/from these shapes in
   features/radiology-tests/utils/mapping.ts.

   In the Site Admin portal every radiology test is a global SITE_ADMIN template:
   `tenantId`, `branchId`, `masterDataId` and all classification refs are NULL
   (the backend forces this — see SiteAdminRadiologyTestController). So the write
   DTO here intentionally omits Tenant / Branch / Master Data / classification ids.

   The radiology model is FLAT — there are NO samples / result parameters /
   reference ranges (those are lab-only).
   ═══════════════════════════════════════════════════════════════════════ */

export type DataSource = 'TENANT' | 'SITE_ADMIN'
export type SamplePriority = 'ROUTINE' | 'URGENT' | 'STAT'
export type TatUnit = 'MINUTES' | 'HOURS' | 'DAYS'
export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
export type RadiologyModality =
  | 'XRAY' | 'CT' | 'MRI' | 'ULTRASOUND' | 'MAMMOGRAPHY'
  | 'PET' | 'FLUOROSCOPY' | 'DEXA' | 'OTHER'
export type ApprovalWorkflow =
  | 'SINGLE_APPROVAL' | 'DUAL_APPROVAL' | 'AUTO_APPROVE' | 'PATHOLOGIST_REVIEW'

/**
 * Create/update payload for a SITE_ADMIN template. Classification ids, mandatory
 * scopes and settings refs are deliberately absent — the backend nulls them for
 * templates, so the Site Admin form never collects or sends them.
 */
export interface RadiologyTestWriteDto {
  // Identity
  testName: string
  testDisplayName?: string
  testCode: string
  aka?: string
  // Radiology classification
  modality?: RadiologyModality
  bodyPart?: string
  view?: string
  isContrast?: boolean
  // Config
  icdCode?: string
  loincCode?: string
  clinicalTags?: string[]
  samplePriorityType?: SamplePriority
  isEnableCms?: boolean
  approvalWorkflow?: ApprovalWorkflow
  // Pricing
  priceMsrp?: number
  priceMaximum?: number
  priceMinimum?: number
  priceOriginal?: number
  franchisePrice?: number
  emergencyPrice?: number
  commissionPrice?: number
  discountCapPct?: number
  isAllowPriceOverride?: boolean
  isAllowDiscounts?: boolean
  // TAT
  tatMinValue?: number
  tatMinUnit?: TatUnit
  tatMaxValue?: number
  tatMaxUnit?: TatUnit
  // Schedule
  scheduleDays?: DayOfWeek[]
  scheduleFrom?: string
  scheduleTo?: string
  // Flags
  isHideInOrderScreen?: boolean
  isPreferenceTest?: boolean
  isOutsource?: boolean
  isBillOnlyTest?: boolean
  // Status
  isActive?: boolean
  // Notes
  usefulFor?: string
  interpretationOfResults?: string
  limitations?: string
  remarks?: string
  references?: string
  preparationInstructions?: string
}

/** Radiology test scalar row as returned by the get-one endpoint (flat). */
export interface RadiologyTestEntity {
  id: string
  tenantId: string | null
  branchId: string | null
  masterDataId: string | null
  source: DataSource
  clonedFromId: string | null
  testName: string
  testDisplayName: string | null
  testCode: string
  aka: string | null
  modality: RadiologyModality
  bodyPart: string | null
  view: string | null
  isContrast: boolean
  departmentId: string | null
  categoryId: string | null
  subCategoryId: string | null
  icdCode: string | null
  loincCode: string | null
  clinicalTags: string[]
  reportTemplateId: string | null
  samplePriorityType: SamplePriority
  isEnableCms: boolean
  approvalWorkflow: ApprovalWorkflow | null
  priceMsrp: number
  priceMaximum: number
  priceMinimum: number
  priceOriginal: number
  franchisePrice: number
  emergencyPrice: number
  commissionPrice: number | null
  discountCapPct: number
  isAllowPriceOverride: boolean
  isAllowDiscounts: boolean
  tatMinValue: number | null
  tatMinUnit: TatUnit | null
  tatMaxValue: number | null
  tatMaxUnit: TatUnit | null
  scheduleDays: DayOfWeek[]
  scheduleFrom: string | null
  scheduleTo: string | null
  isHideInOrderScreen: boolean
  isPreferenceTest: boolean
  isOutsource: boolean
  isBillOnlyTest: boolean
  isActive: boolean
  usefulFor: string | null
  interpretationOfResults: string | null
  limitations: string | null
  remarks: string | null
  references: string | null
  preparationInstructions: string | null
}

/* ═══════════════════════════════════════════════════════════════════════
   Listing "views" — mirror the backend `?view=` projection rows. Each view
   returns a different column subset. The flat radiology model has no
   child-centric views (no samples/results/reference ranges). The grid renders
   columns from these shapes directly.
   ═══════════════════════════════════════════════════════════════════════ */
export type RadiologyTestListView =
  | 'DEFAULT'
  | 'BASIC_DETAILS'
  | 'PRICING'
  | 'TAT'
  | 'FLAGS'
  | 'NOTES'
  | 'OVERVIEW'

export interface RadiologyTestDefaultRow {
  id: string
  testName: string
  testCode: string
  modality: RadiologyModality
  bodyPart: string | null
  departmentName: string | null
  priceMsrp: number
  tatMaxValue: number | null
  tatMaxUnit: TatUnit | null
  isActive: boolean
}

export interface RadiologyTestBasicDetailsRow {
  id: string
  testName: string
  testCode: string
  aka: string | null
  modality: RadiologyModality
  bodyPart: string | null
  view: string | null
  isContrast: boolean
  departmentName: string | null
  categoryName: string | null
  subCategoryName: string | null
  icdCode: string | null
  loincCode: string | null
}

export interface RadiologyTestPricingRow {
  id: string
  testName: string
  testCode: string
  priceMsrp: number
  priceMinimum: number
  priceMaximum: number
  priceOriginal: number
  franchisePrice: number
  emergencyPrice: number
  discountCapPct: number
  isAllowPriceOverride: boolean
  isAllowDiscounts: boolean
}

export interface RadiologyTestTatRow {
  id: string
  testName: string
  tatMinValue: number | null
  tatMinUnit: TatUnit | null
  tatMaxValue: number | null
  tatMaxUnit: TatUnit | null
  scheduleFrom: string | null
  scheduleTo: string | null
}

export interface RadiologyTestFlagsRow {
  id: string
  testName: string
  isHideInOrderScreen: boolean
  isEnableCms: boolean
  isPreferenceTest: boolean
  isOutsource: boolean
  isBillOnlyTest: boolean
  isActive: boolean
}

export interface RadiologyTestNotesRow {
  id: string
  testName: string
  usefulFor: string | null
  interpretationOfResults: string | null
  limitations: string | null
  remarks: string | null
  references: string | null
  preparationInstructions: string | null
}

export interface RadiologyTestOverviewRow {
  id: string
  testName: string
  testCode: string
  modality: RadiologyModality
  departmentName: string | null
  /** "Max value" — interpreted as the maximum price. */
  maxValue: number
  tatMaxValue: number | null
  tatMaxUnit: TatUnit | null
  isActive: boolean
}

/** Union of every per-view row shape returned by the listing endpoint. */
export type RadiologyTestListRow =
  | RadiologyTestDefaultRow
  | RadiologyTestBasicDetailsRow
  | RadiologyTestPricingRow
  | RadiologyTestTatRow
  | RadiologyTestFlagsRow
  | RadiologyTestNotesRow
  | RadiologyTestOverviewRow
