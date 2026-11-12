import { api } from '@/shared/services/api'
import type { PageResult } from '@/shared/ui'

/**
 * Inventory master-reference catalogue (categories, sub-categories, units,
 * brands, variants, tax-rates, expense-/income-categories). These live on the
 * **inventory backend**, reached through the shared nginx `/inventory-api` route.
 * The main {@link api} client attaches the SiteAdmin token for `/inventory-api/*`
 * paths automatically.
 */
const BASE = '/inventory-api/v1/master-reference'

/** SiteAdmin image upload (tenant-less; used by Categories' imageUrl field). */
const UPLOAD_URL = '/api/v1/siteadmin/uploads/attachment'

/**
 * A reference row. The base fields are shared by every resource; the rest are
 * optional and only present on the resources that declare them (tax-rates add
 * rate/type/hsn/cgst/sgst/igst; sub-categories add category; expense-/income-
 * categories add taxRate/taxMethod; categories add imageUrl).
 */
export interface IReferenceRow {
  id: string
  name: string
  code: string | null
  description?: string | null
  imageUrl?: string | null
  // tax-rate fields
  rate?: number | null
  type?: string | null
  hsnCode?: string | null
  cgst?: number | null
  sgst?: number | null
  igst?: number | null
  // sub-category parent
  categoryId?: string | null
  category?: { id: string; name: string } | null
  // expense-/income-category fields
  taxRateId?: string | null
  taxRate?: { id: string; name: string } | null
  taxMethod?: string | null
  isActive: boolean
  createdAt: string
}

export interface IReferenceListResult {
  rows: IReferenceRow[]
  total: number
  totalPages: number
}

/** List a reference resource (e.g. 'categories', 'units'). `categoryId` filters sub-categories. */
export async function listReference(
  resource: string,
  params: { page: number; limit: number; search?: string; categoryId?: string },
): Promise<IReferenceListResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.categoryId) query.categoryId = params.categoryId
  const res = await api.get<IReferenceRow[]>(`${BASE}/${resource}`, { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as IReferenceRow[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

/**
 * Fetch one page of a reference resource in the shape {@link PaginatedSelect}
 * expects. `categoryId` scopes sub-categories to their parent. Page size stays
 * within the backend's limit (≤100) — this is what powers the Load-More selects.
 */
export async function fetchReferencePage(
  resource: string,
  params: { page: number; search: string; pageSize: number; categoryId?: string },
): Promise<PageResult> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.pageSize,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.categoryId) query.categoryId = params.categoryId
  const res = await api.get<IReferenceRow[]>(`${BASE}/${resource}`, { params: query })
  const rows = res.data as IReferenceRow[]
  const meta = (res as { meta?: { page?: number; totalPages?: number } }).meta ?? {}
  return {
    data: rows.map((r) => ({ id: r.id, name: r.name })),
    meta: { page: meta.page ?? params.page, totalPages: meta.totalPages ?? 1 },
  }
}

export async function createReference(resource: string, body: Record<string, unknown>) {
  const res = await api.post(`${BASE}/${resource}`, body, {
    successMessage: 'Created',
  })
  return res.data
}

export async function updateReference(resource: string, id: string, body: Record<string, unknown>) {
  const res = await api.patch(`${BASE}/${resource}/${id}`, body, {
    successMessage: 'Saved',
  })
  return res.data
}

export async function deleteReference(resource: string, id: string) {
  const res = await api.delete(`${BASE}/${resource}/${id}`, {
    successMessage: 'Removed',
  })
  return res.data
}

/** Upload a reference image (e.g. a category thumbnail) and return its public URL. */
export async function uploadReferenceImage(file: File): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post<{ url: string }>(UPLOAD_URL, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipSuccessToast: true,
  })
  return res.data
}
