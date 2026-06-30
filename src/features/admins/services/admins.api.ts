import { api } from '@/shared/services/api'
import type { SiteAdminRole, SiteAdminUser } from '@/entities/siteadmin-user'
import type { ICreateAdminForm, IAdminListParams, IAdminListResult } from '../interfaces'

/**
 * List SiteAdmin accounts with server-side search + role/status filter +
 * pagination. Backend validates/emits role as an UPPERCASE Prisma enum; the UI
 * works in lowercase, so role is uppercased on the way out and lowercased back in.
 */
export async function listAdmins(params: IAdminListParams): Promise<IAdminListResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.role) query.role = params.role.toUpperCase()
  if (params.status) query.status = params.status

  const res = await api.get<SiteAdminUser[]>('/api/v1/siteadmin/users', { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = (res.data as SiteAdminUser[]).map(a => ({
    ...a,
    role: a.role.toLowerCase() as SiteAdminRole,
  }))
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

/** Create a SiteAdmin account (role sent uppercased to match the Prisma enum). */
export async function createAdmin(form: ICreateAdminForm): Promise<unknown> {
  const res = await api.post(
    '/api/v1/siteadmin/users',
    { ...form, role: form.role.toUpperCase() },
    { successMessage: 'Admin account created' },
  )
  return res.data
}

/** Deactivate a SiteAdmin account. */
export async function deactivateAdmin(adminId: string): Promise<unknown> {
  const res = await api.patch(`/api/v1/siteadmin/users/${adminId}/deactivate`, undefined, { successMessage: 'Admin account deactivated' })
  return res.data
}

/** Activate a SiteAdmin account. */
export async function activateAdmin(adminId: string): Promise<unknown> {
  const res = await api.patch(`/api/v1/siteadmin/users/${adminId}/activate`, undefined, { successMessage: 'Admin account activated' })
  return res.data
}

/** Change a SiteAdmin account's password. */
export async function changeAdminPassword(adminId: string, newPassword: string): Promise<unknown> {
  const res = await api.patch(`/api/v1/siteadmin/users/${adminId}/password`, { newPassword }, { successMessage: 'Password updated' })
  return res.data
}
