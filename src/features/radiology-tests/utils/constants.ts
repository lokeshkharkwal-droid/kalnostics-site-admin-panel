import type { RadiologyTest } from '../interfaces'

/* ═══════════════════════════════════════
   OPTION LISTS — display strings whose values the mapping (mapping.ts) knows
   how to translate to/from the backend enums. Keep the exact spelling.
═══════════════════════════════════════ */
export const MODALITIES = [
  'X-Ray', 'CT', 'MRI', 'Ultrasound', 'Mammography',
  'PET', 'Fluoroscopy', 'DEXA', 'Other',
]
export const TAT_UNITS = ['Minutes', 'Hours', 'Days']
export const SAMPLE_PRIORITIES = ['Routine', 'STAT', 'Urgent']
export const STATUS_OPTIONS = ['Active', 'Inactive']
export const SCHEDULE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Build native-<select> option pairs from a plain string list. */
export const opts = (xs: readonly string[]) => xs.map(x => ({ value: x, label: x }))

/** The form sections, in display order. */
export const TEST_SECTIONS = [
  'Basic Details', 'Pricing', 'TAT', 'Schedule', 'Flags', 'Notes',
] as const

/* ═══════════════════════════════════════
   EMPTY-RECORD FACTORY
═══════════════════════════════════════ */
export const emptyTest = (): RadiologyTest => ({
  id: `RT-${Date.now()}`,
  testName: '', testDisplay: '', testCode: '', aka: '',
  modality: 'X-Ray', bodyPart: '', view: '', isContrast: false,
  hideInOrderScreen: false,
  clinicalTags: '', icdCode: '', loincCode: '',
  samplePriorityType: 'Routine', enable: true,
  priceMSRP: 0, priceMax: 0, priceMin: 0, priceOriginal: 0,
  franchisePrice: 0, emergencyPrice: 0, commissionPrice: 0,
  allowPriceOverride: false, discountCap: 0, isAllowDiscounts: true,
  tatMin: 0, tatMinUnit: 'Hours', tatMax: 0, tatMaxUnit: 'Hours',
  scheduleDays: [], scheduleTimeFrom: '', scheduleTimeTo: '',
  billOnlyTest: false, outsource: false, preferredTest: false,
  testStatus: 'Active',
  usefulFor: '', interpretation: '', limitations: '', remarks: '', references: '',
  preparationInstructions: '',
})
