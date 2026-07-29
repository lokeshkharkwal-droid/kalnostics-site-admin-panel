import { api } from '@/shared/services/api'
import type { PageResult } from '@/shared/ui'
import type { EquipmentEntity, EquipmentListRow, EquipmentWriteDto } from '@/entities/equipment'
import type { ListEquipmentParams, ListEquipmentResult } from '../interfaces'

/**
 * SITE_ADMIN equipment — platform-level global lab-equipment catalogue entries
 * referencing SITE_ADMIN lab-test templates. The `/api/v1/siteadmin` prefix
 * tells the api interceptor to attach the `siteadmin_token`.
 */
const BASE = '/api/v1/siteadmin/equipment'

/** SITE_ADMIN lab-test template options endpoint (feeds the Lab Tests select). */
const LAB_TEST_OPTIONS = '/api/v1/siteadmin/lab-tests/options'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Paginated, server-filtered equipment list (search matches name). */
export async function listEquipment(params: ListEquipmentParams): Promise<ListEquipmentResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.search?.trim()) query.search = params.search.trim()

  const res = await api.get<EquipmentListRow[]>(BASE, { params: query })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  const rows = res.data
  return {
    rows,
    total: meta.total ?? rows.length,
    totalPages: meta.totalPages ?? 1,
    page: meta.page ?? params.page ?? 1,
  }
}

/** Fetch one equipment with its mapped lab tests. */
export async function getEquipment(id: string): Promise<EquipmentEntity> {
  const res = await api.get<EquipmentEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create an equipment with its selected lab tests. */
export async function createEquipment(dto: EquipmentWriteDto): Promise<EquipmentEntity> {
  const res = await api.post<EquipmentEntity>(BASE, dto, { successMessage: 'Equipment created' })
  return res.data
}

/** Update an equipment (mapped lab tests replaced when `labTestIds` is sent). */
export async function updateEquipment(id: string, dto: Partial<EquipmentWriteDto>): Promise<EquipmentEntity> {
  const res = await api.patch<EquipmentEntity>(`${BASE}/${id}`, dto, { successMessage: 'Equipment updated' })
  return res.data
}

/** Soft-delete an equipment (its mappings are cascade soft-deleted). */
export async function deleteEquipment(id: string): Promise<EquipmentEntity> {
  const res = await api.delete<EquipmentEntity>(`${BASE}/${id}`, { successMessage: 'Equipment deleted' })
  return res.data
}

/**
 * Page fetcher for `PaginatedSelect` — the Lab Tests multi-select in the
 * Equipment form. Loads active SITE_ADMIN lab-test templates as `{ id, name }`
 * options with search + Load More.
 */
export async function fetchLabTestOptionsPage(
  { page, search, pageSize }: { page: number; search: string; pageSize: number },
): Promise<PageResult> {
  const query: Record<string, string | number> = { page, limit: pageSize }
  if (search.trim()) query.search = search.trim()
  const res = await api.get<{ id: string; name: string }[]>(LAB_TEST_OPTIONS, { params: query, skipSuccessToast: true })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  return {
    data: res.data.map((t) => ({ id: t.id, name: t.name })),
    meta: { page: meta.page ?? page, totalPages: meta.totalPages ?? 1 },
  }
}
