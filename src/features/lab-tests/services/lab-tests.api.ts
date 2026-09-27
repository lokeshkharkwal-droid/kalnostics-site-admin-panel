import { api } from '@/shared/services/api'
import type { LabTestEntity, LabTestListRow, LabTestWriteDto } from '@/entities/lab-test'
import type { ListLabTestsParams, ListLabTestsResult } from '../interfaces'

/**
 * The service a template belongs to. All three share the same request/response
 * shape and are served by mirror SITE_ADMIN endpoints; only the base path differs.
 */
export type TestService = 'lab' | 'radiology' | 'opd'

const BASE_BY_SERVICE: Record<TestService, string> = {
  lab: '/api/v1/siteadmin/lab-tests',
  radiology: '/api/v1/siteadmin/radiology-tests',
  opd: '/api/v1/siteadmin/opd-tests',
}

/**
 * SITE_ADMIN global test templates. The `/api/v1/siteadmin` prefix tells the
 * api interceptor to attach the `siteadmin_token`. The backend auto-sets
 * `source=SITE_ADMIN` and nulls tenant/branch/master-data/classification refs.
 *
 * Resolves the base path for the given `service` (defaults to `'lab'` for
 * backwards compatibility).
 */
const baseFor = (service: TestService = 'lab'): string => BASE_BY_SERVICE[service]

/**
 * Paginated, server-filtered template list, projected into the requested `view`
 * (same projection the Business Admin listing uses). Returns the rows plus the
 * view they were projected for so the grid can match columns to rows.
 */
export async function listLabTests(
  params: ListLabTestsParams,
  service: TestService = 'lab',
): Promise<ListLabTestsResult> {
  const view = params.view ?? 'DEFAULT'
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    view,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status

  const res = await api.get<LabTestListRow[]>(baseFor(service), { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1, view }
}

/** Human-readable noun for toasts, per service. */
const NOUN_BY_SERVICE: Record<TestService, string> = {
  lab: 'Lab test',
  radiology: 'Radiology test',
  opd: 'OPD test',
}

/** Fetch one template composed with all of its child rows. */
export async function getLabTest(id: string, service: TestService = 'lab'): Promise<LabTestEntity> {
  const res = await api.get<LabTestEntity>(`${baseFor(service)}/${id}`)
  return res.data
}

/** Create a template test (with nested samples + result params). */
export async function createLabTest(dto: LabTestWriteDto, service: TestService = 'lab'): Promise<LabTestEntity> {
  const res = await api.post<LabTestEntity>(baseFor(service), dto, { successMessage: `${NOUN_BY_SERVICE[service]} created` })
  return res.data
}

/** Update a template test (child sets are replaced when provided). */
export async function updateLabTest(id: string, dto: Partial<LabTestWriteDto>, service: TestService = 'lab'): Promise<LabTestEntity> {
  const res = await api.patch<LabTestEntity>(`${baseFor(service)}/${id}`, dto, { successMessage: `${NOUN_BY_SERVICE[service]} updated` })
  return res.data
}

/** Soft-delete a template test (cascades to children). */
export async function deleteLabTest(id: string, service: TestService = 'lab'): Promise<LabTestEntity> {
  const res = await api.delete<LabTestEntity>(`${baseFor(service)}/${id}`, { successMessage: `${NOUN_BY_SERVICE[service]} deleted` })
  return res.data
}

/**
 * Lightweight, searchable lookup ({ id, name }) for the reflex-test picker —
 * uses the DEFAULT view (which supports `search` on testName/testCode).
 */
export async function searchLabTestsForReflex(
  params: { search?: string; limit?: number } = {},
  service: TestService = 'lab',
): Promise<{ id: string; name: string }[]> {
  const query: Record<string, string | number> = { page: 1, limit: params.limit ?? 10, view: 'DEFAULT' }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await api.get<{ id: string; testName: string }[]>(baseFor(service), { params: query, skipSuccessToast: true })
  return res.data.map(t => ({ id: t.id, name: t.testName }))
}
