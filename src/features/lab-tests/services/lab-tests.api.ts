import { api } from '@/shared/services/api'
import type { LabTestEntity, LabTestListRow, LabTestWriteDto } from '@/entities/lab-test'
import type { ListLabTestsParams, ListLabTestsResult } from '../interfaces'

/**
 * SITE_ADMIN global lab-test templates. The `/api/v1/siteadmin` prefix tells the
 * api interceptor to attach the `siteadmin_token`. The backend auto-sets
 * `source=SITE_ADMIN` and nulls tenant/branch/master-data/classification refs.
 */
const BASE = '/api/v1/siteadmin/lab-tests'

/**
 * Paginated, server-filtered template list, projected into the requested `view`
 * (same projection the Business Admin listing uses). Returns the rows plus the
 * view they were projected for so the grid can match columns to rows.
 */
export async function listLabTests(params: ListLabTestsParams): Promise<ListLabTestsResult> {
  const view = params.view ?? 'DEFAULT'
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    view,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status

  const res = await api.get<LabTestListRow[]>(BASE, { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1, view }
}

/** Fetch one template composed with all of its child rows. */
export async function getLabTest(id: string): Promise<LabTestEntity> {
  const res = await api.get<LabTestEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create a template lab test (with nested samples + result params). */
export async function createLabTest(dto: LabTestWriteDto): Promise<LabTestEntity> {
  const res = await api.post<LabTestEntity>(BASE, dto, { successMessage: 'Lab test created' })
  return res.data
}

/** Update a template lab test (child sets are replaced when provided). */
export async function updateLabTest(id: string, dto: Partial<LabTestWriteDto>): Promise<LabTestEntity> {
  const res = await api.patch<LabTestEntity>(`${BASE}/${id}`, dto, { successMessage: 'Lab test updated' })
  return res.data
}

/** Soft-delete a template lab test (cascades to children). */
export async function deleteLabTest(id: string): Promise<LabTestEntity> {
  const res = await api.delete<LabTestEntity>(`${BASE}/${id}`, { successMessage: 'Lab test deleted' })
  return res.data
}

/**
 * Lightweight, searchable lookup ({ id, name }) for the reflex-test picker —
 * uses the DEFAULT view (which supports `search` on testName/testCode).
 */
export async function searchLabTestsForReflex(
  params: { search?: string; limit?: number } = {},
): Promise<{ id: string; name: string }[]> {
  const query: Record<string, string | number> = { page: 1, limit: params.limit ?? 10, view: 'DEFAULT' }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await api.get<{ id: string; testName: string }[]>(BASE, { params: query, skipSuccessToast: true })
  return res.data.map(t => ({ id: t.id, name: t.testName }))
}
