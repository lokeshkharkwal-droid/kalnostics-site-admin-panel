import { api } from '@/shared/services/api'
import type {
  ListSupportInfoParams,
  ListSupportInfoResult,
  SupportInfoEntity,
  SupportInfoListRow,
  SupportInfoWriteDto,
} from '../interfaces'

/**
 * SiteAdmin Support Information API. The `/api/v1/siteadmin` prefix tells the
 * axios interceptor to attach the `siteadmin_token`; the response envelope is
 * unwrapped there, with pagination hoisted onto `res.meta`.
 */
const BASE = '/api/v1/siteadmin/support-info'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Paginated, server-filtered list (search matches meta type OR code). */
export async function listSupportInfo(params: ListSupportInfoParams): Promise<ListSupportInfoResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status

  const res = await api.get<SupportInfoListRow[]>(BASE, { params: query })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  const rows = res.data
  return {
    rows,
    total: meta.total ?? rows.length,
    totalPages: meta.totalPages ?? 1,
    page: meta.page ?? params.page ?? 1,
  }
}

/** Fetch one record (includes `helpContent`). */
export async function getSupportInfo(id: string): Promise<SupportInfoEntity> {
  const res = await api.get<SupportInfoEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create a support-information record. */
export async function createSupportInfo(dto: SupportInfoWriteDto): Promise<SupportInfoEntity> {
  const res = await api.post<SupportInfoEntity>(BASE, dto, { successMessage: 'Support information created' })
  return res.data
}

/** Update a support-information record. */
export async function updateSupportInfo(id: string, dto: Partial<SupportInfoWriteDto>): Promise<SupportInfoEntity> {
  const res = await api.patch<SupportInfoEntity>(`${BASE}/${id}`, dto, { successMessage: 'Support information updated' })
  return res.data
}

/** Soft-delete a support-information record. */
export async function deleteSupportInfo(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`, { successMessage: 'Support information deleted' })
}
