import { api } from '@/shared/services/api'
import type { PageResult } from '@/shared/ui'
import type { DepartmentEntity, DepartmentListRow, DepartmentWriteDto } from '@/entities/department'
import type { ListDepartmentsParams, ListDepartmentsResult } from '../interfaces'

/**
 * SITE_ADMIN global department templates. The `/api/v1/siteadmin` prefix tells
 * the api interceptor to attach the `siteadmin_token`. The backend auto-sets
 * `source = SITE_ADMIN`, nulls the tenant, and generates the `code`.
 */
const BASE = '/api/v1/siteadmin/departments'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Paginated, server-filtered template list (search matches name OR code). */
export async function listDepartments(params: ListDepartmentsParams): Promise<ListDepartmentsResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status

  const res = await api.get<DepartmentListRow[]>(BASE, { params: query })
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
export async function getDepartment(id: string): Promise<DepartmentEntity> {
  const res = await api.get<DepartmentEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create a department template. */
export async function createDepartment(dto: DepartmentWriteDto): Promise<DepartmentEntity> {
  const res = await api.post<DepartmentEntity>(BASE, dto, { successMessage: 'Department created' })
  return res.data
}

/** Update a department template (`code` is immutable and never sent). */
export async function updateDepartment(id: string, dto: Partial<DepartmentWriteDto>): Promise<DepartmentEntity> {
  const res = await api.patch<DepartmentEntity>(`${BASE}/${id}`, dto, { successMessage: 'Department updated' })
  return res.data
}

/** Soft-delete a department template. */
export async function deleteDepartment(id: string): Promise<DepartmentEntity> {
  const res = await api.delete<DepartmentEntity>(`${BASE}/${id}`, { successMessage: 'Department deleted' })
  return res.data
}

/**
 * Page fetcher for `PaginatedSelect` — the parent Department dropdown in the
 * Category / Sub-Category forms. Only ACTIVE templates are selectable.
 */
export async function fetchDepartmentOptionsPage(
  { page, search, pageSize }: { page: number; search: string; pageSize: number },
): Promise<PageResult> {
  const query: Record<string, string | number> = { page, limit: pageSize, status: 'ACTIVE' }
  if (search.trim()) query.search = search.trim()
  const res = await api.get<DepartmentListRow[]>(BASE, { params: query, skipSuccessToast: true })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  return {
    data: res.data.map((d) => ({ id: d.id, name: d.name })),
    meta: { page: meta.page ?? page, totalPages: meta.totalPages ?? 1 },
  }
}

/**
 * Resolve department `id → name` for the parent-name column in the Category /
 * Sub-Category grids. Pages through at the backend's max page size (100); a
 * bounded SITE_ADMIN catalogue, so the page cap is never realistically hit.
 */
export async function fetchDepartmentNameMap(): Promise<Record<string, string>> {
  const PAGE_LIMIT = 100
  const MAX_PAGES = 20
  const map: Record<string, string> = {}
  let page = 1
  let totalPages = 1
  do {
    const res = await api.get<DepartmentListRow[]>(BASE, { params: { page, limit: PAGE_LIMIT }, skipSuccessToast: true })
    const meta = (res as { meta?: ListMeta }).meta ?? {}
    totalPages = meta.totalPages ?? 1
    for (const d of res.data) map[d.id] = d.name
    page++
  } while (page <= totalPages && page <= MAX_PAGES)
  if (totalPages > MAX_PAGES) {
    // eslint-disable-next-line no-console
    console.warn(`[departments] name-map covered first ${MAX_PAGES} of ${totalPages} pages; some parent names may show as ids`)
  }
  return map
}
