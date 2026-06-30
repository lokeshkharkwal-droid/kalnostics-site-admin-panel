import { api } from '@/shared/services/api'
import type { Tenant, TenantDetail, BusinessAdmin } from '@/entities/tenant'
import type {
  ICreateTenantForm,
  ICreateTenantResult,
  IResetCredentials,
  ITenantListParams,
  ITenantListResult,
} from '../interfaces'

/**
 * List tenants with server-side search + status filter + pagination.
 * The API interceptor hoists pagination into `res.meta`. Backend returns
 * subscriptionStatus as an UPPERCASE Prisma enum, normalised to lowercase here.
 */
export async function listTenants(params: ITenantListParams): Promise<ITenantListResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.status) query.status = params.status

  const res = await api.get<Tenant[]>('/api/v1/siteadmin/tenants', { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = (res.data as Tenant[]).map(t => ({
    ...t,
    subscriptionStatus: t.subscriptionStatus.toLowerCase(),
  }))
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

/** Create a tenant + its business-admin account. Combines country code + phone. */
export async function createTenant(form: ICreateTenantForm): Promise<ICreateTenantResult> {
  const payload = {
    ...form,
    phone:      form.phone.trim() ? form.phoneCountryCode + form.phone.trim() : undefined,
    adminPhone: form.adminPhone.trim() ? form.adminPhoneCountryCode + form.adminPhone.trim() : form.adminPhone,
    phoneCountryCode: undefined,
    adminPhoneCountryCode: undefined,
  }
  const res = await api.post('/api/v1/siteadmin/tenants', payload, { successMessage: 'Business created' })
  return res.data as ICreateTenantResult
}

/** Fetch a single tenant's full detail (subscriptionStatus normalised to lowercase). */
export async function getTenant(id: string): Promise<TenantDetail> {
  const res = await api.get<TenantDetail>(`/api/v1/siteadmin/tenants/${id}`)
  const t = res.data as TenantDetail
  return { ...t, subscriptionStatus: t.subscriptionStatus.toLowerCase() } as TenantDetail
}

/** Patch a tenant's editable fields + settings. */
export async function updateTenant(id: string, body: Record<string, unknown>): Promise<TenantDetail> {
  const res = await api.patch(`/api/v1/siteadmin/tenants/${id}`, body, { successMessage: 'Changes saved' })
  return res.data as TenantDetail
}

/** Fetch the business-admin account attached to a tenant (null if none). */
export async function getTenantAdmin(id: string): Promise<BusinessAdmin | null> {
  const res = await api.get<BusinessAdmin | null>(`/api/v1/siteadmin/tenants/${id}/admin`)
  return res.data as BusinessAdmin | null
}

/** Reset the business-admin password, returning the new one-time credentials. */
export async function resetTenantAdminPassword(id: string): Promise<IResetCredentials> {
  const res = await api.post<IResetCredentials>(
    `/api/v1/siteadmin/tenants/${id}/admin/reset-password`,
    undefined,
    { successMessage: 'Password reset' },
  )
  return res.data
}
