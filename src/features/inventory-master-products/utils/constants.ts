import type {
  BarcodeSymbology,
  MasterProductType,
  SalesMethod,
  TaxMethod,
} from '../interfaces'

/** Product type options for the Basic section select. */
export const TYPE_OPTIONS: { value: MasterProductType; label: string }[] = [
  { value: 'branded', label: 'Branded' },
  { value: 'generic', label: 'Generic' },
  { value: 'standard', label: 'Standard' },
  { value: 'combo', label: 'Combo' },
  { value: 'digital', label: 'Digital' },
  { value: 'service', label: 'Service' },
]

/** Barcode symbology options (default is code128). */
export const BARCODE_OPTIONS: { value: BarcodeSymbology; label: string }[] = [
  { value: 'code25', label: 'Code 25' },
  { value: 'code39', label: 'Code 39' },
  { value: 'code128', label: 'Code 128' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'ean13', label: 'EAN-13' },
  { value: 'upca', label: 'UPC-A' },
  { value: 'upce', label: 'UPC-E' },
]

export const SALES_METHOD_OPTIONS: { value: SalesMethod; label: string }[] = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Pack', label: 'Pack' },
]

export const TAX_METHOD_OPTIONS: { value: TaxMethod; label: string }[] = [
  { value: 'Inclusive', label: 'Inclusive' },
  { value: 'Exclusive', label: 'Exclusive' },
]

/** Jump-nav section labels for the form modal. */
export const PRODUCT_SECTIONS = [
  'Basic',
  'Prescription Fields',
  'Custom Fields',
  'Variants',
  'Suppliers',
  'Other',
] as const

/** Max number of supplier-config rows. */
export const MAX_SUPPLIERS = 5
