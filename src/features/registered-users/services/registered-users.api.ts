import { api } from '@/shared/services/api'
import type {
  RegisteredUser,
  RegisteredUserDetail,
  IRegisteredUserListParams,
  IRegisteredUserListResult,
} from '../interfaces'

/**
 * List registered persons across the whole portal
 * (`/siteadmin/registered-users`) with server-side search + status filter +
 * pagination. The `{ data, meta }` envelope is unwrapped by the shared axios
 * interceptor (`meta` is hoisted onto the response).
 */
export async function listRegisteredUsers(
  params: IRegisteredUserListParams,
): Promise<IRegisteredUserListResult> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status // active | inactive

  const res = await api.get<RegisteredUser[]>('/api/v1/siteadmin/registered-users', {
    params: query,
  })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as RegisteredUser[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

/** Fetch full read-only detail for one registered person. */
export async function getRegisteredUser(id: string): Promise<RegisteredUserDetail> {
  const res = await api.get<RegisteredUserDetail>(
    `/api/v1/siteadmin/registered-users/${id}`,
  )
  return res.data as RegisteredUserDetail
}
