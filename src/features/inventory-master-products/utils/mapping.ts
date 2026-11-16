import type { IMasterProduct, IMasterProductForm, SalesMethod, TaxMethod } from '../interfaces'

const s = (v: string | null | undefined): string => v ?? ''
const n = (v: number | null | undefined): string => (v == null ? '' : String(v))

/** Backend SCREAMING_SNAKE enums → the form's display values (tolerant of either). */
const toSalesMethod = (v: string | null | undefined): SalesMethod =>
  String(v).toUpperCase() === 'PACK' ? 'Pack' : 'Individual'
const toTaxMethod = (v: string | null | undefined): TaxMethod =>
  String(v).toUpperCase() === 'INCLUSIVE' ? 'Inclusive' : 'Exclusive'

/** Build a blank form for the "Add product" flow (with EZ Health Track defaults). */
export function emptyForm(): IMasterProductForm {
  return {
    // Basic
    type: 'standard',
    name: '',
    code: '',
    barcodeSymbology: 'code128',
    categoryId: '',
    categoryName: '',
    subCategoryId: '',
    subCategoryName: '',
    unitId: '',
    unitName: '',
    packSize: '',
    salesMethod: 'Individual',
    packCost: '',
    cost: '',
    packMrp: '',
    price: '',
    taxRateId: '',
    taxRateName: '',
    hsnCode: '',
    taxMethod: 'Exclusive',
    taxMethodPurchase: 'Exclusive',
    alertQuantity: '',
    isTrackQuantity: true,
    imageUrl: '',
    galleryImageUrls: [],
    isImportable: true,
    brandId: '',
    brandName: '',
    manufacturerId: '',
    manufacturerName: '',

    // Prescription
    hasPrescriptionFields: false,
    composition: '',
    strength: '',
    unitType: '',
    formulation: '',
    route: '',
    frequency: '',
    numberOfDays: '',
    prescriptionQuantity: '',
    refills: false,
    refillTimes: '',
    prescriptionNotes: '',

    // Custom
    hasCustomFields: false,
    cf1: '',
    cf2: '',
    cf3: '',
    cf4: '',
    cf5: '',
    cf6: '',
    cf7: '',
    cf8: '',
    cf9: '',
    cf10: '',
    cf11: '',

    // Variants
    hasVariants: false,
    variants: [],

    // Suppliers
    suppliers: [],

    // Combo
    comboItems: [],

    // Digital
    digitalFileUrl: '',

    // Other
    description: '',
    invoiceDetails: '',

    isActive: true,
  }
}

/** Hydrate the string-based form from a loaded product (including nested rows). */
export function toForm(p: IMasterProduct): IMasterProductForm {
  return {
    // Basic
    type: p.type ?? 'standard',
    name: s(p.name),
    code: s(p.code),
    barcodeSymbology: p.barcodeSymbology ?? 'code128',
    categoryId: s(p.categoryId),
    categoryName: s(p.categoryName),
    subCategoryId: s(p.subCategoryId),
    subCategoryName: s(p.subCategoryName),
    unitId: s(p.unitId),
    unitName: s(p.unitName),
    packSize: n(p.packSize),
    salesMethod: toSalesMethod(p.salesMethod),
    packCost: n(p.packCost),
    cost: n(p.cost),
    packMrp: n(p.packMrp),
    price: n(p.price),
    taxRateId: s(p.taxRateId),
    taxRateName: s(p.taxRateName),
    hsnCode: s(p.hsnCode),
    taxMethod: toTaxMethod(p.taxMethod),
    taxMethodPurchase: toTaxMethod(p.taxMethodPurchase),
    alertQuantity: n(p.alertQuantity),
    isTrackQuantity: p.isTrackQuantity ?? true,
    imageUrl: s(p.imageUrl),
    galleryImageUrls: Array.isArray(p.galleryImageUrls) ? [...p.galleryImageUrls] : [],
    isImportable: p.isImportable ?? true,
    brandId: s(p.brandId),
    brandName: s(p.brandName),
    manufacturerId: s(p.manufacturerId),
    manufacturerName: s(p.manufacturerName),

    // Prescription
    hasPrescriptionFields: p.hasPrescriptionFields ?? false,
    composition: s(p.composition),
    strength: s(p.strength),
    unitType: s(p.unitType),
    formulation: s(p.formulation),
    route: s(p.route),
    frequency: s(p.frequency),
    numberOfDays: n(p.numberOfDays),
    prescriptionQuantity: n(p.prescriptionQuantity),
    refills: p.refills ?? false,
    refillTimes: n(p.refillTimes),
    prescriptionNotes: s(p.prescriptionNotes),

    // Custom
    hasCustomFields: p.hasCustomFields ?? false,
    cf1: s(p.cf1),
    cf2: s(p.cf2),
    cf3: s(p.cf3),
    cf4: s(p.cf4),
    cf5: s(p.cf5),
    cf6: s(p.cf6),
    cf7: s(p.cf7),
    cf8: s(p.cf8),
    cf9: s(p.cf9),
    cf10: s(p.cf10),
    cf11: s(p.cf11),

    // Variants
    hasVariants: p.hasVariants ?? false,
    variants: Array.isArray(p.variants)
      ? p.variants.map((v) => ({ id: v.id, name: v.name, cost: v.cost, price: v.price }))
      : [],

    // Suppliers
    suppliers: Array.isArray(p.suppliers)
      ? p.suppliers.map((sup) => ({
          id: sup.id,
          supplierId: sup.supplierId,
          supplierName: sup.supplierName ?? null,
          partNumber: sup.partNumber ?? '',
          price: sup.price,
        }))
      : [],

    // Combo
    comboItems: Array.isArray(p.comboItems)
      ? p.comboItems.map((c) => ({
          id: c.id,
          itemProductId: c.itemProductId,
          itemProductName: c.itemProductName ?? null,
          quantity: c.quantity,
          price: c.price,
        }))
      : [],

    // Digital
    digitalFileUrl: s(p.digitalFileUrl),

    // Other
    description: s(p.description),
    invoiceDetails: s(p.invoiceDetails),

    isActive: p.isActive ?? true,
  }
}
