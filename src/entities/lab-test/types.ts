/* ═══════════════════════════════════════════════════════════════════════
   Backend-facing Lab Test contract (mirrors kalnostics-new lab-test DTOs +
   Prisma model). The rich UI `LabTest` (string-based) is mapped to/from these
   shapes in features/lab-tests/utils/mapping.ts.

   In the Site Admin portal every lab test is a global SITE_ADMIN template:
   `tenantId`, `branchId`, `masterDataId` and all classification refs are NULL
   (the backend forces this — see SiteAdminLabTestController). So the write DTO
   here intentionally omits Tenant / Branch / Master Data / classification ids.
   ═══════════════════════════════════════════════════════════════════════ */

export type DataSource = 'TENANT' | 'SITE_ADMIN'
export type ProcessMethod = 'SINGLE_STEP' | 'MULTI_STEP'
export type SamplePriority = 'ROUTINE' | 'URGENT' | 'STAT'
export type TatUnit = 'MINUTES' | 'HOURS' | 'DAYS'
export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
export type ContainerType =
  | 'EDTA_TUBE_PURPLE_TOP' | 'PLAIN_TUBE_RED_TOP' | 'FLUORIDE_TUBE_GREY_TOP'
  | 'URINE_CONTAINER' | 'STERILE_CONTAINER'
export type ResultType = 'QUANTITATIVE' | 'QUALITATIVE' | 'CALCULATED'
export type ResultGroupLayout = 'TABULAR' | 'SEQUENTIAL'
export type ParameterType = 'MEASURED' | 'CALCULATED'
export type ResultEntryMode = 'MANUAL' | 'AUTO'
export type ResultRounding =
  | 'NO_ROUNDING' | 'ONE_DECIMAL' | 'TWO_DECIMAL' | 'THREE_DECIMAL' | 'WHOLE_NUMBER'
export type ReferenceGender = 'ALL' | 'MALE' | 'FEMALE'
export type AgeUnit = 'DAYS' | 'MONTHS' | 'YEARS'
export type AbnormalFlag =
  | 'BOLD_AND_RED' | 'BOLD_ONLY' | 'ITALIC' | 'UNDERLINE' | 'COLOUR_HIGHLIGHT'
export type RepeatIntervalUnit = 'HOURS' | 'DAYS' | 'MONTHS' | 'YEARS'

export interface LabTestReferenceRangeDto {
  method?: string
  gender?: ReferenceGender
  ageFrom?: number
  ageFromUnit?: AgeUnit
  ageTo?: number
  ageToUnit?: AgeUnit
  lowerLimit?: number
  upperLimit?: number
  criticalMin?: number
  criticalMax?: number
  displayOfReferenceRange?: string
  abnormalFlagLogic?: AbnormalFlag
}

export interface LabTestReferenceValueDto {
  method?: string
  gender?: ReferenceGender
  ageFrom?: number
  ageFromUnit?: AgeUnit
  ageTo?: number
  ageToUnit?: AgeUnit
  normalValueText: string
  displayOfReferenceRange?: string
  abnormalFlagLogic?: AbnormalFlag
}

/** A reflex-test reference sent on write ({ id, name }); only `id` is persisted. */
export interface ReflexTestRefDto {
  id: string
  name: string
}

export interface LabTestResultParamDto {
  groupName?: string
  groupLayout?: ResultGroupLayout
  parameterName: string
  parameterCode: string
  method?: string
  reportingUnit?: string
  resultType: ResultType
  parameterType?: ParameterType
  resultEntryMode?: ResultEntryMode
  calculationFormula?: string
  resultRoundingType?: ResultRounding
  allowableUnits?: string
  decimalPlaces?: number
  criticalMin?: number
  criticalMax?: number
  reflexTests?: ReflexTestRefDto[]
  notes?: string
  isNabl?: boolean
  isCap?: boolean
  sortOrder?: number
  referenceRanges?: LabTestReferenceRangeDto[]
  referenceValues?: LabTestReferenceValueDto[]
}

export interface LabTestSampleDto {
  sampleType?: string
  containerType?: ContainerType
  sampleSize?: string
  collectionMethod?: string
  numberOfSamples?: number
  stability?: string
  transportTemperature?: string
  preservative?: string
  sampleHandlingInstructions?: string
  isFastingRequired?: boolean
  isLightProtection?: boolean
  isDefault?: boolean
}

/**
 * Create/update payload for a SITE_ADMIN template. Classification ids, mandatory
 * scopes and settings refs are deliberately absent — the backend nulls them for
 * templates, so the Site Admin form never collects or sends them.
 */
export interface LabTestWriteDto {
  testName: string
  testDisplayName?: string
  testCode: string
  aka?: string
  processMethod?: ProcessMethod
  icdCode?: string
  loincCode?: string
  clinicalTags?: string[]
  samplePriorityType?: SamplePriority
  isEnableCms?: boolean
  priceMsrp?: number
  priceMaximum?: number
  priceMinimum?: number
  priceOriginal?: number
  franchisePrice?: number
  emergencyPrice?: number
  discountCapPct?: number
  isAllowPriceOverride?: boolean
  isAllowDiscounts?: boolean
  tatMinValue?: number
  tatMinUnit?: TatUnit
  tatMaxValue?: number
  tatMaxUnit?: TatUnit
  scheduleDays?: DayOfWeek[]
  scheduleFrom?: string
  scheduleTo?: string
  processingTimeFrom?: string
  processingTimeTo?: string
  procTimeMinValue?: number
  procTimeMinUnit?: TatUnit
  procTimeMaxValue?: number
  procTimeMaxUnit?: TatUnit
  approvalTimeFrom?: string
  approvalTimeTo?: string
  isHideInOrderScreen?: boolean
  isPreferenceTest?: boolean
  isRepeatIntervalRestriction?: boolean
  repeatIntervalValue?: number
  repeatIntervalUnit?: RepeatIntervalUnit
  isActive?: boolean
  usefulFor?: string
  interpretationOfResults?: string
  limitations?: string
  remarks?: string
  references?: string
  samples?: LabTestSampleDto[]
  resultParams?: LabTestResultParamDto[]
}

/** Lab test scalar row as returned by the get-one endpoint (children present). */
export interface LabTestEntity {
  id: string
  tenantId: string | null
  branchId: string | null
  masterDataId: string | null
  source: DataSource
  testName: string
  testDisplayName: string | null
  testCode: string
  aka: string | null
  departmentId: string | null
  categoryId: string | null
  subCategoryId: string | null
  mandatoryDeptId: string | null
  mandatoryCatId: string | null
  mandatorySubcatId: string | null
  processMethod: ProcessMethod
  icdCode: string | null
  loincCode: string | null
  clinicalTags: string[]
  samplePriorityType: SamplePriority
  isEnableCms: boolean
  priceMsrp: number
  priceMaximum: number
  priceMinimum: number
  priceOriginal: number
  franchisePrice: number
  emergencyPrice: number
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
  processingTimeFrom: string | null
  processingTimeTo: string | null
  procTimeMinValue: number | null
  procTimeMinUnit: TatUnit | null
  procTimeMaxValue: number | null
  procTimeMaxUnit: TatUnit | null
  approvalTimeFrom: string | null
  approvalTimeTo: string | null
  isHideInOrderScreen: boolean
  isPreferenceTest: boolean
  isMandatoryTest: boolean
  isRepeatIntervalRestriction: boolean
  repeatIntervalValue: number | null
  repeatIntervalUnit: RepeatIntervalUnit | null
  isActive: boolean
  usefulFor: string | null
  interpretationOfResults: string | null
  limitations: string | null
  remarks: string | null
  references: string | null
  samples?: LabTestSampleEntity[]
  resultParams?: LabTestResultParamEntity[]
}

export interface LabTestSampleEntity {
  id: string
  sampleType: string | null
  containerType: ContainerType | null
  sampleSize: string | null
  collectionMethod: string | null
  numberOfSamples: number
  stability: string | null
  transportTemperature: string | null
  preservative: string | null
  sampleHandlingInstructions: string | null
  isFastingRequired: boolean
  isLightProtection: boolean
  isDefault: boolean
}

export interface LabTestResultParamEntity {
  id: string
  groupName: string | null
  groupLayout?: ResultGroupLayout | null
  parameterName: string
  parameterCode: string
  method: string | null
  reportingUnit: string | null
  resultType: ResultType
  parameterType: ParameterType
  resultEntryMode: ResultEntryMode
  calculationFormula: string | null
  resultRoundingType?: ResultRounding | null
  allowableUnits?: string | null
  decimalPlaces: number
  criticalMin: string | number | null
  criticalMax: string | number | null
  reflexTestIds?: string[]
  reflexTests?: ReflexTestRefDto[]
  notes: string | null
  isNabl: boolean
  isCap: boolean
  referenceRanges?: LabTestReferenceRangeEntity[]
  referenceValues?: LabTestReferenceValueEntity[]
}

export interface LabTestReferenceRangeEntity {
  id: string
  method: string | null
  gender: ReferenceGender
  ageFrom: number
  ageFromUnit: AgeUnit
  ageTo: number
  ageToUnit: AgeUnit
  lowerLimit: string | number | null
  upperLimit: string | number | null
  criticalMin: string | number | null
  criticalMax: string | number | null
  displayOfReferenceRange: string | null
  abnormalFlagLogic: AbnormalFlag
}

export interface LabTestReferenceValueEntity {
  id: string
  method: string | null
  gender: ReferenceGender
  ageFrom: number
  ageFromUnit: AgeUnit
  ageTo: number
  ageToUnit: AgeUnit
  normalValueText: string
  displayOfReferenceRange: string | null
  abnormalFlagLogic: AbnormalFlag
}

/* ═══════════════════════════════════════════════════════════════════════
   Listing "views" — mirror the backend `?view=` projection rows. Each view
   returns a different column subset (and, for the child-centric views, nested
   arrays). The grid renders columns from these shapes directly. Version Control
   is intentionally excluded from the Site Admin UI.
   ═══════════════════════════════════════════════════════════════════════ */
export type LabTestListView =
  | 'DEFAULT'
  | 'BASIC_DETAILS'
  | 'PRICING'
  | 'TAT'
  | 'FLAGS'
  | 'SAMPLE'
  | 'RESULTS'
  | 'REFERENCE_RANGE'
  | 'REFERENCE_VALUE'
  | 'NOTES'
  | 'OVERVIEW'

export interface LabTestDefaultRow {
  id: string
  testName: string
  testCode: string
  departmentName: string | null
  priceMsrp: number
  tatMaxValue: number | null
  tatMaxUnit: TatUnit | null
  defaultSample: { sampleType: string | null; containerType: ContainerType | null } | null
  parametersCount: number
  isActive: boolean
}

export interface LabTestBasicDetailsRow {
  id: string
  testName: string
  testCode: string
  aka: string | null
  departmentName: string | null
  categoryName: string | null
  subCategoryName: string | null
  processMethod: ProcessMethod
  approvalWorkflowId: string | null
  isMandatoryTest: boolean
  samplePriorityType: SamplePriority
  icdCode: string | null
  loincCode: string | null
}

export interface LabTestPricingRow {
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

export interface LabTestTatRow {
  id: string
  testName: string
  tatMinValue: number | null
  tatMinUnit: TatUnit | null
  tatMaxValue: number | null
  tatMaxUnit: TatUnit | null
  scheduleFrom: string | null
  scheduleTo: string | null
  procTimeMinValue: number | null
  procTimeMinUnit: TatUnit | null
  procTimeMaxValue: number | null
  procTimeMaxUnit: TatUnit | null
  approvalTimeFrom: string | null
  approvalTimeTo: string | null
}

export interface LabTestFlagsRow {
  id: string
  testName: string
  isHideInOrderScreen: boolean
  isEnableCms: boolean
  isPreferenceTest: boolean
  isActive: boolean
}

export interface LabTestSampleRow {
  id: string
  sampleNameId: string | null
  sampleType: string | null
  containerType: ContainerType | null
  sampleSize: string | null
  isFastingRequired: boolean
  transportTemperature: string | null
}

export interface LabTestSampleViewRow {
  id: string
  testName: string
  testCode: string
  departmentName: string | null
  isActive: boolean
  samples: LabTestSampleRow[]
}

export interface LabTestResultsParamRow {
  id: string
  parameterName: string
  method: string | null
  resultType: ResultType
  units: string | null
  isNabl: boolean
  isCap: boolean
}

export interface LabTestResultsRow {
  id: string
  testName: string
  testCode: string
  departmentName: string | null
  isActive: boolean
  resultParams: LabTestResultsParamRow[]
}

export interface LabTestRefRangeRow {
  id: string
  parameterName: string
  method: string | null
  gender: ReferenceGender
  ageFrom: number
  ageTo: number
  lowerLimit: string | number | null
  upperLimit: string | number | null
  displayOfReferenceRange: string | null
  flag: AbnormalFlag
}

export interface LabTestReferenceRangeRow {
  id: string
  testName: string
  testCode: string
  referenceRanges: LabTestRefRangeRow[]
}

export interface LabTestRefValueRow {
  id: string
  parameterName: string
  method: string | null
  gender: ReferenceGender
  ageFrom: number
  ageTo: number
  displayValue: string
  flag: AbnormalFlag
}

export interface LabTestReferenceValueRow {
  id: string
  testName: string
  testCode: string
  referenceValues: LabTestRefValueRow[]
}

export interface LabTestNotesRow {
  id: string
  testName: string
  usefulFor: string | null
  interpretationOfResults: string | null
  limitations: string | null
  remarks: string | null
  references: string | null
}

export interface LabTestOverviewRow {
  id: string
  testName: string
  testCode: string
  departmentName: string | null
  maxValue: number
  tatMaxValue: number | null
  tatMaxUnit: TatUnit | null
  samplesCount: number
  parametersCount: number
  isActive: boolean
}

/** Union of every per-view row shape returned by the listing endpoint. */
export type LabTestListRow =
  | LabTestDefaultRow
  | LabTestBasicDetailsRow
  | LabTestPricingRow
  | LabTestTatRow
  | LabTestFlagsRow
  | LabTestSampleViewRow
  | LabTestResultsRow
  | LabTestReferenceRangeRow
  | LabTestReferenceValueRow
  | LabTestNotesRow
  | LabTestOverviewRow
