import { api } from '@/shared/services/api'
import type { PageResult } from '@/shared/ui'
import type { CategoryEntity, CategoryListRow, CategoryWriteDto } from '@/entities/category'
import type { ListCategoriesParams, ListCategoriesResult } from '../interfaces'

/** SITE_ADMIN global category templates. */
const BASE = '/api/v1/siteadmin/categories'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Paginated, server-filtered template list (search matches name OR code). */
export async function listCategories(params: ListCategoriesParams): Promise<ListCategoriesResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status

  const res = await api.get<CategoryListRow[]>(BASE, { params: query })
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
export async function getCategory(id: string): Promise<CategoryEntity> {
  const res = await api.get<CategoryEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create a category template. */
export async function createCategory(dto: CategoryWriteDto): Promise<CategoryEntity> {
  const res = await api.post<CategoryEntity>(BASE, dto, { successMessage: 'Category created' })
  return res.data
}

/** Update a category template (`code` is immutable and never sent). */
export async function updateCategory(id: string, dto: Partial<CategoryWriteDto>): Promise<CategoryEntity> {
  const res = await api.patch<CategoryEntity>(`${BASE}/${id}`, dto, { successMessage: 'Category updated' })
  return res.data
}

/** Soft-delete a category template. */
export async function deleteCategory(id: string): Promise<CategoryEntity> {
  const res = await api.delete<CategoryEntity>(`${BASE}/${id}`, { successMessage: 'Category deleted' })
  return res.data
}

/** Page fetcher for `PaginatedSelect` — the parent Category dropdown in the
 *  Sub-Category form. Only ACTIVE templates are selectable. */
export async function fetchCategoryOptionsPage(
  { page, search, pageSize }: { page: number; search: string; pageSize: number },
): Promise<PageResult> {
  const query: Record<string, string | number> = { page, limit: pageSize, status: 'ACTIVE' }
  if (search.trim()) query.search = search.trim()
  const res = await api.get<CategoryListRow[]>(BASE, { params: query, skipSuccessToast: true })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  return {
    data: res.data.map((c) => ({ id: c.id, name: c.name })),
    meta: { page: meta.page ?? page, totalPages: meta.totalPages ?? 1 },
  }
}

/**
 * Resolve category `id → name` for the parent-name column in the Sub-Category
 * grid. Pages through at the backend's max page size (100).
 */
export async function fetchCategoryNameMap(): Promise<Record<string, string>> {
  const PAGE_LIMIT = 100
  const MAX_PAGES = 20
  const map: Record<string, string> = {}
  let page = 1
  let totalPages = 1
  do {
    const res = await api.get<CategoryListRow[]>(BASE, { params: { page, limit: PAGE_LIMIT }, skipSuccessToast: true })
    const meta = (res as { meta?: ListMeta }).meta ?? {}
    totalPages = meta.totalPages ?? 1
    for (const c of res.data) map[c.id] = c.name
    page++
  } while (page <= totalPages && page <= MAX_PAGES)
  if (totalPages > MAX_PAGES) {
    // eslint-disable-next-line no-console
    console.warn(`[categories] name-map covered first ${MAX_PAGES} of ${totalPages} pages; some parent names may show as ids`)
  }
  return map
}
