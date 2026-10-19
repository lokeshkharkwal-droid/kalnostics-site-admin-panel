import { api } from '@/shared/services/api'
import type {
  RadiologyTestEntity, RadiologyTestListRow, RadiologyTestWriteDto,
} from '@/entities/radiology-test'
import type { ListRadiologyTestsParams, ListRadiologyTestsResult } from '../interfaces'

/**
 * SITE_ADMIN global radiology-test templates. The `/api/v1/siteadmin` prefix
 * tells the api interceptor to attach the `siteadmin_token`. The backend
 * auto-sets `source=SITE_ADMIN` and nulls tenant/branch/master-data/
 * classification refs.
 */
const BASE = '/api/v1/siteadmin/radiology-tests'

/**
 * Paginated, server-filtered template list, projected into the requested `view`
 * (same projection the Business Admin listing uses). Returns the rows plus the
 * view they were projected for so the grid can match columns to rows.
 */
export async function listRadiologyTests(params: ListRadiologyTestsParams): Promise<ListRadiologyTestsResult> {
  const view = params.view ?? 'DEFAULT'
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    view,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status
  if (params.modality) query.modality = params.modality

  const res = await api.get<RadiologyTestListRow[]>(BASE, { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1, view }
}

/** Fetch one template radiology test (flat scalar row). */
export async function getRadiologyTest(id: string): Promise<RadiologyTestEntity> {
  const res = await api.get<RadiologyTestEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create a template radiology test. */
export async function createRadiologyTest(dto: RadiologyTestWriteDto): Promise<RadiologyTestEntity> {
  const res = await api.post<RadiologyTestEntity>(BASE, dto, { successMessage: 'Radiology test created' })
  return res.data
}

/** Update a template radiology test. */
export async function updateRadiologyTest(id: string, dto: Partial<RadiologyTestWriteDto>): Promise<RadiologyTestEntity> {
  const res = await api.patch<RadiologyTestEntity>(`${BASE}/${id}`, dto, { successMessage: 'Radiology test updated' })
  return res.data
}

/** Soft-delete a template radiology test. */
export async function deleteRadiologyTest(id: string): Promise<RadiologyTestEntity> {
  const res = await api.delete<RadiologyTestEntity>(`${BASE}/${id}`, { successMessage: 'Radiology test deleted' })
  return res.data
}
