import { api } from '@/shared/services/api'
import type {
  AuthRole,
  IRoleForm,
  IRoleListParams,
  IRoleListResult,
} from '../interfaces'

/**
 * List the global role catalogue (`/siteadmin/roles`) with server-side search +
 * status filter + pagination. The `{ data, meta }` envelope is unwrapped by the
 * shared axios interceptor (`meta` is hoisted onto the response).
 */
export async function listRoles(params: IRoleListParams): Promise<IRoleListResult> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status.toUpperCase() // ACTIVE | INACTIVE

  const res = await api.get<AuthRole[]>('/api/v1/siteadmin/roles', { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as AuthRole[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

/** Fetch one global role by id. */
export async function getRole(id: string): Promise<AuthRole> {
  const res = await api.get<AuthRole>(`/api/v1/siteadmin/roles/${id}`)
  return res.data as AuthRole
}

/** Create a new global role (available to all tenants). */
export async function createRole(form: IRoleForm): Promise<AuthRole> {
  const res = await api.post(
    '/api/v1/siteadmin/roles',
    {
      name: form.name,
      description: form.description.trim() || undefined,
      isActive: form.isActive,
      allowedBranchTypes: form.allowedBranchTypes,
    },
    { successMessage: 'Role created' },
  )
  return res.data as AuthRole
}

/**
 * Update a global role. Built-in roles accept only description/status server-side;
 * for those, `name`/`allowedBranchTypes` are not sent (the form disables them).
 */
export async function updateRole(
  id: string,
  patch: Partial<IRoleForm>,
): Promise<AuthRole> {
  const body: Record<string, unknown> = {}
  if (patch.name !== undefined) body.name = patch.name
  if (patch.description !== undefined) body.description = patch.description
  if (patch.isActive !== undefined) body.isActive = patch.isActive
  if (patch.allowedBranchTypes !== undefined) {
    body.allowedBranchTypes = patch.allowedBranchTypes
  }
  const res = await api.patch(`/api/v1/siteadmin/roles/${id}`, body, {
    successMessage: 'Role updated',
  })
  return res.data as AuthRole
}
