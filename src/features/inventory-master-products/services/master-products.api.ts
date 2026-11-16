import { api } from '@/shared/services/api'
import { inventoryApi } from '@/shared/services/inventory-api'
import type { PageResult } from '@/shared/ui'
import type {
  IMasterProduct,
  IMasterProductForm,
  IMasterProductListParams,
  IMasterProductListResult,
} from '../interfaces'

/**
 * Inventory master-product endpoints (SiteAdmin). The inventory backend is a
 * separate service reached via the shared nginx `/inventory-api` route; the
 * {@link inventoryApi} client attaches the SiteAdmin token and unwraps the
 * `{ success, data, meta }` envelope.
 */
const BASE = '/inventory-api/api/v1/master-products/manage'

/** Suppliers option endpoint (id + name) used by the supplier-config selects. */
const SUPPLIERS_OPTIONS = '/inventory-api/api/v1/master-suppliers/options'

/** Manufacturers list endpoint (rows carry id + name) for the manufacturer select. */
const MANUFACTURERS = '/inventory-api/api/v1/master-manufacturers'

/** SiteAdmin Variant Master (id + name) — the source for variant-row names. */
const VARIANTS = '/inventory-api/api/v1/master-reference/variants'

/**
 * SiteAdmin image upload for master-product images (tenant-less; images only).
 * Lives on the **main Kalnostics API** (not the inventory backend) — the main
 * {@link api} client attaches the SiteAdmin token for `/api/v1/siteadmin/*`.
 */
const UPLOAD_URL = '/api/v1/siteadmin/uploads/attachment'

/* ── value coercion helpers ─────────────────────────────────────────────── */
const num = (v: string): number | null => (v.trim() === '' ? null : Number(v))
const str = (v: string): string | null => (v.trim() === '' ? null : v.trim())

/** Map the form's display enum values to the backend's SCREAMING_SNAKE enums. */
const SALES_METHOD_MAP: Record<string, 'INDIVIDUAL' | 'PACK'> = {
  Individual: 'INDIVIDUAL',
  Pack: 'PACK',
}
const TAX_METHOD_MAP: Record<string, 'INCLUSIVE' | 'EXCLUSIVE'> = {
  Inclusive: 'INCLUSIVE',
  Exclusive: 'EXCLUSIVE',
}

/** Convert the string-based form into the backend's typed create/update payload. */
function toPayload(form: IMasterProductForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    // Basic
    type: form.type,
    name: form.name.trim(),
    code: str(form.code),
    barcodeSymbology: form.barcodeSymbology,
    categoryId: str(form.categoryId),
    subCategoryId: str(form.subCategoryId),
    unitId: str(form.unitId),
    packSize: str(form.packSize),
    salesMethod: SALES_METHOD_MAP[form.salesMethod],
    packCost: num(form.packCost),
    cost: num(form.cost),
    packMrp: num(form.packMrp),
    price: num(form.price),
    taxRateId: str(form.taxRateId),
    hsnCode: str(form.hsnCode),
    taxMethod: TAX_METHOD_MAP[form.taxMethod],
    taxMethodPurchase: TAX_METHOD_MAP[form.taxMethodPurchase],
    alertQuantity: num(form.alertQuantity),
    isTrackQuantity: form.isTrackQuantity,
    imageUrl: str(form.imageUrl),
    galleryImageUrls: form.galleryImageUrls,
    isImportable: form.isImportable,
    brandId: str(form.brandId),
    manufacturerId: str(form.manufacturerId),

    // Other
    description: str(form.description),
    invoiceDetails: str(form.invoiceDetails),

    isActive: form.isActive,
  }

  // Prescription fields — only sent when the section is enabled. (The
  // `hasPrescriptionFields` gate is FE-only; the backend infers from the values.)
  if (form.hasPrescriptionFields) {
    payload.composition = str(form.composition)
    payload.strength = str(form.strength)
    payload.unitType = str(form.unitType)
    payload.formulation = str(form.formulation)
    payload.route = str(form.route)
    payload.frequency = str(form.frequency)
    payload.numberOfDays = str(form.numberOfDays)
    payload.prescriptionQuantity = str(form.prescriptionQuantity)
    payload.refills = form.refills ? 'yes' : 'no'
    payload.refillTimes = str(form.refillTimes)
    payload.prescriptionNotes = str(form.prescriptionNotes)
  } else {
    for (const k of [
      'composition', 'strength', 'unitType', 'formulation', 'route', 'frequency',
      'numberOfDays', 'prescriptionQuantity', 'refillTimes', 'prescriptionNotes',
    ]) payload[k] = null
    payload.refills = false
  }

  // Custom fields — only sent when the section is enabled. (FE-only gate.)
  if (form.hasCustomFields) {
    payload.cf1 = str(form.cf1)
    payload.cf2 = str(form.cf2)
    payload.cf3 = str(form.cf3)
    payload.cf4 = str(form.cf4)
    payload.cf5 = str(form.cf5)
    payload.cf6 = str(form.cf6)
    payload.cf7 = str(form.cf7)
    payload.cf8 = str(form.cf8)
    payload.cf9 = str(form.cf9)
    payload.cf10 = str(form.cf10)
    payload.cf11 = str(form.cf11)
  } else {
    for (let i = 1; i <= 11; i++) payload[`cf${i}`] = null
  }

  // Variants — only sent when the product has variants.
  payload.hasVariants = form.hasVariants
  payload.variants = form.hasVariants
    ? form.variants
        .filter((v) => v.name.trim() !== '')
        .map((v) => ({
          name: v.name.trim(),
          cost: v.cost == null ? undefined : Number(v.cost),
          price: v.price == null ? undefined : Number(v.price),
        }))
    : []

  // Suppliers (max 5) — only rows with a chosen supplier.
  payload.suppliers = form.suppliers
    .filter((s) => s.supplierId)
    .slice(0, 5)
    .map((s) => ({
      supplierId: s.supplierId,
      partNumber: s.partNumber?.trim() || undefined,
      price: s.price == null ? undefined : Number(s.price),
    }))

  // Combo items — only sent for a combo product (rows with a chosen child product).
  payload.comboItems =
    form.type === 'combo'
      ? form.comboItems
          .filter((c) => c.itemProductId)
          .map((c) => ({
            itemProductId: c.itemProductId,
            quantity: c.quantity == null ? undefined : Number(c.quantity),
            price: c.price == null ? undefined : Number(c.price),
          }))
      : []

  // Digital file — only sent for a digital product.
  payload.digitalFileUrl = form.type === 'digital' ? str(form.digitalFileUrl) : undefined

  return payload
}

/** List master products (SiteAdmin view — active + inactive). */
export async function listMasterProducts(
  params: IMasterProductListParams,
): Promise<IMasterProductListResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await inventoryApi.get<IMasterProduct[]>(BASE, { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as IMasterProduct[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

/** Fetch a single master product with its nested variants / suppliers / combo items. */
export async function getMasterProduct(id: string): Promise<IMasterProduct> {
  const res = await inventoryApi.get<IMasterProduct>(`${BASE}/${id}`)
  return res.data as IMasterProduct
}

export async function createMasterProduct(form: IMasterProductForm): Promise<unknown> {
  const res = await inventoryApi.post(BASE, toPayload(form), {
    successMessage: 'Master product created',
  })
  return res.data
}

export async function updateMasterProduct(id: string, form: IMasterProductForm): Promise<unknown> {
  const res = await inventoryApi.patch(`${BASE}/${id}`, toPayload(form), {
    successMessage: 'Master product updated',
  })
  return res.data
}

export async function deleteMasterProduct(id: string): Promise<unknown> {
  const res = await inventoryApi.delete(`${BASE}/${id}`, {
    successMessage: 'Master product removed',
  })
  return res.data
}

export async function duplicateMasterProduct(id: string): Promise<unknown> {
  const res = await inventoryApi.post(
    `${BASE}/${id}/duplicate`,
    {},
    { successMessage: 'Master product duplicated' },
  )
  return res.data
}

/**
 * Fetch one page of supplier options in the {@link PaginatedSelect} shape. The
 * options endpoint returns `{ id, name }` rows (optionally paginated).
 */
export async function fetchSupplierOptionsPage(params: {
  page: number
  search: string
  pageSize: number
}): Promise<PageResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.pageSize }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await inventoryApi.get<{ id: string; name: string }[]>(SUPPLIERS_OPTIONS, {
    params: query,
  })
  const rows = (res.data as { id: string; name: string }[]) ?? []
  const meta = (res as { meta?: { page?: number; totalPages?: number } }).meta ?? {}
  return {
    data: rows.map((r) => ({ id: r.id, name: r.name })),
    meta: { page: meta.page ?? params.page, totalPages: meta.totalPages ?? 1 },
  }
}

/**
 * Fetch one page of manufacturer options in the {@link PaginatedSelect} shape.
 * Manufacturer rows carry a display `name`.
 */
export async function fetchManufacturerOptionsPage(params: {
  page: number
  search: string
  pageSize: number
}): Promise<PageResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.pageSize }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await inventoryApi.get<{ id: string; name: string }[]>(MANUFACTURERS, {
    params: query,
  })
  const rows = (res.data as { id: string; name: string }[]) ?? []
  const meta = (res as { meta?: { page?: number; totalPages?: number } }).meta ?? {}
  return {
    data: rows.map((r) => ({ id: r.id, name: r.name })),
    meta: { page: meta.page ?? params.page, totalPages: meta.totalPages ?? 1 },
  }
}

/**
 * Fetch one page of Variant Master options in the {@link PaginatedSelect} shape.
 * Variant rows carry a display `name` — this is the SiteAdmin-maintained list a
 * product's variant rows pick their name from.
 */
export async function fetchVariantOptionsPage(params: {
  page: number
  search: string
  pageSize: number
}): Promise<PageResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.pageSize }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await inventoryApi.get<{ id: string; name: string }[]>(VARIANTS, { params: query })
  const rows = (res.data as { id: string; name: string }[]) ?? []
  const meta = (res as { meta?: { page?: number; totalPages?: number } }).meta ?? {}
  return {
    data: rows.map((r) => ({ id: r.id, name: r.name })),
    meta: { page: meta.page ?? params.page, totalPages: meta.totalPages ?? 1 },
  }
}

/**
 * Fetch one page of master products as combo-child options in the
 * {@link PaginatedSelect} shape (id + name), from the SiteAdmin catalogue.
 */
export async function fetchComboProductOptionsPage(params: {
  page: number
  search: string
  pageSize: number
}): Promise<PageResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.pageSize }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await inventoryApi.get<{ id: string; name: string }[]>(BASE, { params: query })
  const rows = (res.data as { id: string; name: string }[]) ?? []
  const meta = (res as { meta?: { page?: number; totalPages?: number } }).meta ?? {}
  return {
    data: rows.map((r) => ({ id: r.id, name: r.name })),
    meta: { page: meta.page ?? params.page, totalPages: meta.totalPages ?? 1 },
  }
}

/** A master product's drug-composition row (EZHT "Drugs" modal). */
export interface IMasterProductDrug {
  id: string
  name: string
  unitValue: string | null
  unit: string | null
}

/** List a product's drug-composition rows. */
export async function listProductDrugs(productId: string): Promise<IMasterProductDrug[]> {
  const res = await inventoryApi.get<IMasterProductDrug[]>(`${BASE}/${productId}/drugs`)
  return (res.data as IMasterProductDrug[]) ?? []
}

/** Add a drug-composition row to a product. */
export async function addProductDrug(
  productId: string,
  body: { name: string; unitValue?: string; unit?: string },
): Promise<IMasterProductDrug> {
  const res = await inventoryApi.post<IMasterProductDrug>(`${BASE}/${productId}/drugs`, body, {
    successMessage: 'Drug added',
  })
  return res.data as IMasterProductDrug
}

/** Delete a single drug-composition row from a product. */
export async function deleteProductDrug(productId: string, drugId: string): Promise<unknown> {
  const res = await inventoryApi.delete(`${BASE}/${productId}/drugs/${drugId}`, {
    successMessage: 'Drug removed',
  })
  return res.data
}

/** True when the Variant Master has at least one entry (gates free-text fallback). */
export async function hasAnyVariantMaster(): Promise<boolean> {
  const res = await inventoryApi.get<{ id: string; name: string }[]>(VARIANTS, {
    params: { page: 1, limit: 1 },
  })
  const rows = (res.data as { id: string; name: string }[]) ?? []
  return rows.length > 0
}

/**
 * Upload a single master-product image to S3 via the SiteAdmin upload endpoint
 * and return its resolved public URL. The endpoint takes a multipart `file`
 * field and returns `{ url }`; `res.data` is already unwrapped by the api client.
 */
export async function uploadMasterProductImage(file: File): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post<{ url: string }>(UPLOAD_URL, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipSuccessToast: true,
  })
  return res.data
}

/**
 * Upload a digital-product file (type=digital) to S3 and return its public URL.
 * Uses the same SiteAdmin attachment endpoint as images (which also accepts the
 * common document formats stored as a product's digital file).
 */
export async function uploadMasterProductFile(file: File): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post<{ url: string }>(UPLOAD_URL, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipSuccessToast: true,
  })
  return res.data
}

