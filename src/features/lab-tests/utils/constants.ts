import type { LabTest } from '../interfaces'

/* ═══════════════════════════════════════
   OPTION LISTS — display strings whose values the mapping (mapping.ts) knows
   how to translate to/from the backend enums. Keep the exact spelling.
═══════════════════════════════════════ */
export const METHODS = [
  'Spectrophotometry', 'Chemiluminescence', 'ELISA', 'PCR', 'Flow Cytometry',
  'Microscopy', 'Culture', 'Turbidimetry',
]
/* Sample Name dropdown options (126 values) — the LIMS master sample list,
   kept in step with the business/branch-admin SAMPLE_TYPES and the backend
   STANDARD_SAMPLE_NAMES. sampleName is free text on the write DTO, so these are
   not enum-mapped; they only populate the picker. */
export const SAMPLE_TYPES = [
  'AFB-Stained Smear Slide',
  'Amniotic Fluid',
  'Aqueous Humor',
  'Ascitic Fluid',
  'Bacterial Isolate',
  'BAL Fluid',
  'Bile',
  'Bile Duct Calculus',
  'Body Fluid - Unspecified',
  'Bone Marrow Aspirate',
  'Bronchial Washing',
  'Capillary Whole Blood (Finger Prick)',
  'Catheter Tip',
  'Cell Block',
  'Chorionic Villus Tissue',
  'Clinical Specimen - Miscellaneous',
  'Conventional Pap Smear Slide',
  'Cord Blood',
  'Core Needle Biopsy',
  'CSF',
  'Culture Isolate / Pure Culture',
  'Cyst Fluid',
  'Cytology Slide',
  'Drain Fluid',
  'Enterolith',
  'Exhaled Breath',
  'Eye Swab',
  'FNAC Aspirate',
  'FNAC Smear Slide',
  'Frozen Section Slide',
  'Fungal Isolate',
  'Gallbladder Calculus',
  'Gastric Aspirate',
  'Gram-Stained Smear Slide',
  'H&E-Stained Tissue Section Slide',
  'Hair',
  'Heel Prick Blood',
  'Hemodialysis Fluid',
  'Histopathology Slide',
  'KOH Preparation Slide',
  'Liquid-Based Cytology (LBC) Slide',
  'Malaria Blood Smear Slide',
  'Nail Clippings',
  'Nail Scrapings',
  'Nasopharyngeal Swab',
  'Oro and Nasopharyngeal Swab',
  'Oropharyngeal Swab',
  'Pancreatic Duct Calculus',
  'Paraffin Tissue Block (FFPE Block)',
  'Pelvic Washing',
  'Pericardial Fluid',
  'Peripheral Blood Smear Slide',
  'Peritoneal Dialysis Effluent',
  'Peritoneal Washing',
  'Plasma-3.2% Sodium Citrate',
  'Plasma-EDTA',
  'Plasma-Fluoride-1st Hr GTT',
  'Plasma-Fluoride-2nd Hr GTT',
  'Plasma-Fluoride-3rd Hr GTT',
  'Plasma-Fluoride-F',
  'Plasma-Fluoride-GCT',
  'Plasma-Fluoride-PP',
  'Plasma-Fluoride-R',
  'Plasma-Sodium Heparin',
  'Pleural Fluid',
  'Plucked Hair',
  'Prostatic Calculus',
  'Pus / Abscess Aspirate',
  'Reference Microbial Strain',
  'Renal Biopsy (Electron Microscopy - Glutaraldehyde)',
  "Renal Biopsy (Immunofluorescence - ZEUS/Michel's)",
  "Renal Biopsy (Light Microscopy - Formalin/Michel's)",
  'Renal Calculus',
  'Research Microbial Strain',
  'Reticulocyte Smear Slide',
  'Saliva',
  'Salivary Calculus',
  'Semen',
  'Semen Smear Slide',
  'Seroma Fluid',
  'Serum-Gel',
  'Serum-Plain',
  'Skin Biopsy',
  'Skin Scraping',
  'Skin Smear',
  'Skin Swab',
  'Slit-Skin Smear',
  'Smear',
  'Special-Stained Tissue Section Slide',
  'Sputum',
  'Stool',
  'Swab-Dry / Plain',
  'Swab-Transport Medium (Amies/Stuart)',
  'Swab-VTM (Viral)',
  'Sweat',
  'Synovial Fluid',
  'Tissue / Aspirate - Unspecified',
  'Tissue-Fixed (10% NBF)',
  'Tissue-Unfixed (Fresh/Saline)',
  'Tonsillolith',
  'Unstained Tissue Section Slide',
  'Ureteric Calculus',
  'Urethral Calculus',
  'Urethral Swab',
  'Urine-24Hr (Acetic Acid)',
  'Urine-24Hr (Boric Acid)',
  'Urine-24Hr (Diazolidinyl Urea)',
  'Urine-24Hr (HCl)',
  'Urine-24Hr (No Preservative)',
  'Urine-24Hr (Sodium Carbonate)',
  'Urine-Random (No Preservative)',
  'Vaginal Swab',
  'Vesical Calculus',
  'Vitreous Fluid',
  'WB-3.2% Sodium Citrate',
  'WB-3.8% Sodium Citrate (ESR)',
  'WB-Culture Aerobic',
  'WB-Culture Anaerobic',
  'WB-Culture Pediatric',
  'WB-EDTA',
  'WB-Lithium Heparin',
  'WB-Sodium Heparin',
  'Wet Mount Slide',
  'Wound Exudate',
  'Wound Swab',
  'Yeast Isolate',
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
export const APPROVAL_WORKFLOWS = ['Single Approval', 'Dual Approval', 'Auto Approve', 'Pathologist Review']
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
  processMethod: 'Single Step', approvalWorkflow: '',
  hideInOrderScreen: false,
  clinicalTags: '', icdCode: '', loincCode: '',
  samplePriorityType: 'Routine', enable: true,
  repeatIntervalRestriction: false, intervalDuration: '', intervalUnit: 'Hours', intervalOverrideAllowed: false,
  priceMSRP: 0, priceMax: 0, priceMin: 0, priceOriginal: 0, franchisePrice: 0, emergencyPrice: 0,
  allowPriceOverride: false, discountCap: 0,
  tatMin: 0, tatMinUnit: 'Hours', tatMax: 0, tatMaxUnit: 'Hours',
  scheduleDays: [], scheduleTimeFrom: '', scheduleTimeTo: '',
  processingTimeFrom: '', processingTimeTo: '',
  approvalTimeFrom: '', approvalTimeTo: '',
  reportingTimeFrom: '', reportingTimeTo: '',
  procTimeMin: 0, procTimeMinUnit: 'Hours', procTimeMax: 0, procTimeMaxUnit: 'Hours',
  approvalTimeMin: 0, approvalTimeMinUnit: 'Hours', approvalTimeMax: 0, approvalTimeMaxUnit: 'Hours',
  billOnlyTest: false, isAllowDiscounts: true, outsource: false, preferredTest: false,
  sampleFlow: false, testStatus: 'Active',
  samples: [], results: [], referenceRanges: [], referenceValues: [],
  usefulFor: '', interpretation: '', limitations: '', remarks: '', references: '',
})
