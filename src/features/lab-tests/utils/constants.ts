import type { LabTest } from '../interfaces'

/* ═══════════════════════════════════════
   OPTION LISTS — display strings whose values the mapping (mapping.ts) knows
   how to translate to/from the backend enums. Keep the exact spelling.
═══════════════════════════════════════ */
export const METHODS = [
  'Spectrophotometry', 'Chemiluminescence', 'ELISA', 'PCR', 'Flow Cytometry',
  'Microscopy', 'Culture', 'Turbidimetry',
]
export const SAMPLE_TYPES = [
  'Blood (EDTA)', 'Serum (Plain)', 'Blood (Citrate)', 'Blood (Fluoride)',
  'Urine', 'Stool', 'CSF', 'Sputum', 'Swab',
]
export const CONTAINERS = [
  'EDTA Tube (Purple)', 'Plain Tube (Red)', 'Citrate Tube (Blue)',
  'Fluoride Tube (Grey)', 'Urine Container', 'Stool Container',
]
export const RESULT_TYPES = ['Quantitative', 'Qualitative', 'Semi-quantitative']
export const PARAMETER_TYPES = ['Measured', 'Calculated']
export const ENTRY_MODES = ['Manual', 'Instrument', 'Both']
export const GROUP_LAYOUTS = ['Tabular Layout', 'Sequential Layout']
export const GENDER_OPTIONS = ['All', 'Male', 'Female']
export const AGE_UNITS = ['Days', 'Months', 'Years']
export const TAT_UNITS = ['Minutes', 'Hours', 'Days']
export const INTERVAL_UNITS = ['Hours', 'Days', 'Months', 'Years']
export const PROCESS_METHODS = ['Single Step', 'Multi Step']
export const SAMPLE_PRIORITIES = ['Routine', 'STAT', 'Urgent']
export const STATUS_OPTIONS = ['Active', 'Inactive']
export const SCHEDULE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const ABNORMAL_FLAG_OPTIONS = [
  'Bold', 'Italic', 'Bold and Red', 'Italic and Red', 'Italic Bold', 'Bold Italic and Red',
]

/** Build native-<select> option pairs from a plain string list. */
export const opts = (xs: readonly string[]) => xs.map(x => ({ value: x, label: x }))

/** The form sections, in display order (Version Control is excluded). */
export const TEST_SECTIONS = [
  'Basic Details', 'Pricing', 'TAT', 'Flags', 'Sample',
  'Results', 'Reference Range', 'Reference Values', 'Notes',
] as const

/* ═══════════════════════════════════════
   EMPTY-RECORD FACTORY
═══════════════════════════════════════ */
export const emptyTest = (): LabTest => ({
  id: `T-${Date.now()}`,
  testName: '', testDisplay: '', testCode: '', aka: '',
  processMethod: 'Single Step',
  hideInOrderScreen: false,
  clinicalTags: '', icdCode: '', loincCode: '',
  samplePriorityType: 'Routine', enable: true,
  repeatIntervalRestriction: false, intervalDuration: '', intervalUnit: 'Hours',
  priceMSRP: 0, priceMax: 0, priceMin: 0, priceOriginal: 0, franchisePrice: 0, emergencyPrice: 0,
  allowPriceOverride: false, discountCap: 0,
  tatMin: 0, tatMinUnit: 'Hours', tatMax: 0, tatMaxUnit: 'Hours',
  scheduleDays: [], scheduleTimeFrom: '', scheduleTimeTo: '',
  processingTimeFrom: '', processingTimeTo: '',
  approvalTimeFrom: '', approvalTimeTo: '',
  procTimeMin: 0, procTimeMinUnit: 'Hours', procTimeMax: 0, procTimeMaxUnit: 'Hours',
  billOnlyTest: false, isAllowDiscounts: true, outsource: false, preferredTest: false,
  sampleFlow: false, testStatus: 'Active',
  samples: [], results: [], referenceRanges: [], referenceValues: [],
  usefulFor: '', interpretation: '', limitations: '', remarks: '', references: '',
})
