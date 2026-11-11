import { inventoryApi } from '@/shared/services/inventory-api'
import type { PageResult } from '@/shared/ui'

const BASE = '/api/v1/master-reference'

/** A reference row (categories/units/brands share this; tax adds `rate`, sub-cat adds `category`). */
export interface IReferenceRow {
  id: string
  name: string
  code: string | null
  description?: string | null
  rate?: number | null
  categoryId?: string | null
  category?: { id: string; name: string } | null
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
  const res = await inventoryApi.get<IReferenceRow[]>(`${BASE}/${resource}`, { params: query })
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
  const res = await inventoryApi.get<IReferenceRow[]>(`${BASE}/${resource}`, { params: query })
  const rows = res.data as IReferenceRow[]
  const meta = (res as { meta?: { page?: number; totalPages?: number } }).meta ?? {}
  return {
    data: rows.map((r) => ({ id: r.id, name: r.name })),
    meta: { page: meta.page ?? params.page, totalPages: meta.totalPages ?? 1 },
  }
}

export async function createReference(resource: string, body: Record<string, unknown>) {
  const res = await inventoryApi.post(`${BASE}/${resource}`, body, {
    successMessage: 'Created',
  })
  return res.data
}

export async function updateReference(resource: string, id: string, body: Record<string, unknown>) {
  const res = await inventoryApi.patch(`${BASE}/${resource}/${id}`, body, {
    successMessage: 'Saved',
  })
  return res.data
}

export async function deleteReference(resource: string, id: string) {
  const res = await inventoryApi.delete(`${BASE}/${resource}/${id}`, {
    successMessage: 'Removed',
  })
  return res.data
}
