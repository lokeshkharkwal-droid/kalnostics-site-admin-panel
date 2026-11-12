/* ═══════════════════════════════════════════════════════════════════════
   Inventory Master Products — SiteAdmin types.

   A global (platform-level) inventory catalogue product that tenants import
   into their own inventory. Rebuilt to full EZ Health Track "add product"
   parity: basic details, prescription fields, custom fields, variants and
   supplier configuration.
   ═══════════════════════════════════════════════════════════════════════ */

/** Product kind. Drives which extra sections are relevant downstream. */
export type MasterProductType = 'branded' | 'generic' | 'standard' | 'combo' | 'digital' | 'service'

/** Barcode symbology for the product label / barcode print. */
export type BarcodeSymbology =
  | 'code25'
  | 'code39'
  | 'code128'
  | 'ean8'
  | 'ean13'
  | 'upca'
  | 'upce'

/** How the product is sold / costed: by individual unit or by pack. */
export type SalesMethod = 'Individual' | 'Pack'

/** Tax application method. */
export type TaxMethod = 'Inclusive' | 'Exclusive'

/** A pricing variant of a product (e.g. different strength / size). */
export interface IMasterProductVariant {
  id?: string
  name: string
  cost: number | null
  price: number | null
}

/** A supplier offer for the product (part number + supplier price). */
export interface IMasterProductSupplier {
  id?: string
  supplierId: string
  /** Supplier display name — carried for hydrating the select on edit. */
  supplierName?: string | null
  partNumber: string | null
  price: number | null
}

/** A combo child line (for `type === 'combo'`): a constituent master product + qty + price. */
export interface IMasterProductComboItem {
  id?: string
  itemProductId: string
  /** Child product display name — carried for hydrating the select on edit. */
  itemProductName?: string | null
  quantity: number | null
  price: number | null
}

/** A global inventory master product (platform-level, SiteAdmin-maintained). */
export interface IMasterProduct {
  id: string

  // Basic
  type: MasterProductType
  name: string
  code: string | null
  barcodeSymbology: BarcodeSymbology | null
  categoryId: string | null
  categoryName: string | null
  subCategoryId: string | null
  subCategoryName: string | null
  unitId: string | null
  unitName: string | null
  packSize: number | null
  salesMethod: SalesMethod | null
  packCost: number | null
  cost: number | null
  packMrp: number | null
  price: number | null
  taxRateId: string | null
  taxRateName: string | null
  hsnCode: string | null
  taxMethod: TaxMethod | null
  taxMethodPurchase: TaxMethod | null
  alertQuantity: number | null
  isTrackQuantity: boolean
  imageUrl: string | null
  galleryImageUrls: string[]
  isImportable: boolean
  brandId: string | null
  brandName: string | null
  manufacturerId: string | null
  manufacturerName: string | null

  // Prescription (gated)
  hasPrescriptionFields: boolean
  composition: string | null
  strength: string | null
  unitType: string | null
  formulation: string | null
  route: string | null
  frequency: string | null
  numberOfDays: number | null
  prescriptionQuantity: number | null
  refills: boolean
  refillTimes: number | null
  prescriptionNotes: string | null

  // Custom fields (gated)
  hasCustomFields: boolean
  cf1: string | null
  cf2: string | null
  cf3: string | null
  cf4: string | null
  cf5: string | null
  cf6: string | null
  cf7: string | null
  cf8: string | null
  cf9: string | null
  cf10: string | null
  cf11: string | null

  // Variants
  hasVariants: boolean
  variants: IMasterProductVariant[]

  // Suppliers
  suppliers: IMasterProductSupplier[]

  // Combo (type === 'combo')
  comboItems: IMasterProductComboItem[]

  // Digital (type === 'digital')
  digitalFileUrl: string | null

  // Other
  description: string | null
  invoiceDetails: string | null

  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** The number of custom-field slots (cf1..cf11). */
export const CUSTOM_FIELD_COUNT = 11

/** Create/update payload for the form (string-based; numbers coerced on save). */
export interface IMasterProductForm {
  // Basic
  type: MasterProductType
  name: string
  code: string
  barcodeSymbology: BarcodeSymbology
  categoryId: string
  categoryName: string
  subCategoryId: string
  subCategoryName: string
  unitId: string
  unitName: string
  packSize: string
  salesMethod: SalesMethod
  packCost: string
  cost: string
  packMrp: string
  price: string
  taxRateId: string
  taxRateName: string
  hsnCode: string
  taxMethod: TaxMethod
  taxMethodPurchase: TaxMethod
  alertQuantity: string
  isTrackQuantity: boolean
  imageUrl: string
  galleryImageUrls: string[]
  isImportable: boolean
  brandId: string
  brandName: string
  manufacturerId: string
  manufacturerName: string

  // Prescription
  hasPrescriptionFields: boolean
  composition: string
  strength: string
  unitType: string
  formulation: string
  route: string
  frequency: string
  numberOfDays: string
  prescriptionQuantity: string
  refills: boolean
  refillTimes: string
  prescriptionNotes: string

  // Custom
  hasCustomFields: boolean
  cf1: string
  cf2: string
  cf3: string
  cf4: string
  cf5: string
  cf6: string
  cf7: string
  cf8: string
  cf9: string
  cf10: string
  cf11: string

  // Variants
  hasVariants: boolean
  variants: IMasterProductVariant[]

  // Suppliers
  suppliers: IMasterProductSupplier[]

  // Combo (type === 'combo')
  comboItems: IMasterProductComboItem[]

  // Digital (type === 'digital')
  digitalFileUrl: string

  // Other
  description: string
  invoiceDetails: string

  isActive: boolean
}

export interface IMasterProductListParams {
  page: number
  limit: number
  search?: string
}

export interface IMasterProductListResult {
  rows: IMasterProduct[]
  total: number
  totalPages: number
}
