import { api } from '@/shared/services/api'
import type { SubCategoryEntity, SubCategoryListRow, SubCategoryWriteDto } from '@/entities/sub-category'
import type { ListSubCategoriesParams, ListSubCategoriesResult } from '../interfaces'

/** SITE_ADMIN global sub-category templates. */
const BASE = '/api/v1/siteadmin/sub-categories'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Paginated, server-filtered template list (search matches name OR code). */
export async function listSubCategories(params: ListSubCategoriesParams): Promise<ListSubCategoriesResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status

  const res = await api.get<SubCategoryListRow[]>(BASE, { params: query })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  const rows = res.data
  return {
    rows,
    total: meta.total ?? rows.length,
    totalPages: meta.totalPages ?? 1,
    page: meta.page ?? params.page ?? 1,
  }
}

/** Fetch one template. */
export async function getSubCategory(id: string): Promise<SubCategoryEntity> {
  const res = await api.get<SubCategoryEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create a sub-category template. */
export async function createSubCategory(dto: SubCategoryWriteDto): Promise<SubCategoryEntity> {
  const res = await api.post<SubCategoryEntity>(BASE, dto, { successMessage: 'Sub-category created' })
  return res.data
}

/** Update a sub-category template (`code` is immutable and never sent). */
export async function updateSubCategory(id: string, dto: Partial<SubCategoryWriteDto>): Promise<SubCategoryEntity> {
  const res = await api.patch<SubCategoryEntity>(`${BASE}/${id}`, dto, { successMessage: 'Sub-category updated' })
  return res.data
}

/** Soft-delete a sub-category template. */
export async function deleteSubCategory(id: string): Promise<SubCategoryEntity> {
  const res = await api.delete<SubCategoryEntity>(`${BASE}/${id}`, { successMessage: 'Sub-category deleted' })
  return res.data
}
