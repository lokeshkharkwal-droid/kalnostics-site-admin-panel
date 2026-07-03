import { api } from '@/shared/services/api'
import type {
  Tenant,
  TenantDetail,
  TenantConfiguration,
  TenantSetting,
  BusinessAdmin,
} from '@/entities/tenant'
import type {
  ICreateTenantForm,
  ICreateTenantResult,
  IResetCredentials,
  ITenantBranch,
  ITenantBranchListParams,
  ITenantBranchListResult,
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

/** Create a tenant + its business-admin account. Combines country code + phone
 *  and maps the location SelectOptions down to their ids. */
export async function createTenant(form: ICreateTenantForm): Promise<ICreateTenantResult> {
  const trimOrUndef = (v: string) => (v.trim() ? v.trim() : undefined)
  const payload = {
    name: form.name.trim(),
    email: trimOrUndef(form.email),
    phone: form.phone.trim() ? form.phoneCountryCode + form.phone.trim() : undefined,
    shortName: trimOrUndef(form.shortName),
    addressLine: trimOrUndef(form.addressLine),
    pincode: trimOrUndef(form.pincode),
    countryId: form.country?.id,
    stateId: form.state?.id,
    cityId: form.city?.id,
    areaId: form.area?.id,
    logoUrl: trimOrUndef(form.logoUrl),
    photoUrl: trimOrUndef(form.photoUrl),
    adminFirstName: form.adminFirstName.trim(),
    adminMiddleName: trimOrUndef(form.adminMiddleName),
    adminLastName: trimOrUndef(form.adminLastName),
    adminPhone: form.adminPhone.trim() ? form.adminPhoneCountryCode + form.adminPhone.trim() : form.adminPhone,
    adminEmail: trimOrUndef(form.adminEmail),
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

/** Suspend a business — sets its subscription status to SUSPENDED. */
export async function suspendTenant(id: string): Promise<TenantDetail> {
  const res = await api.patch(`/api/v1/siteadmin/tenants/${id}/suspend`, undefined, {
    successMessage: 'Business suspended',
  })
  return res.data as TenantDetail
}

/** Reactivate a suspended business — sets its subscription status to ACTIVE. */
export async function reactivateTenant(id: string): Promise<TenantDetail> {
  const res = await api.patch(`/api/v1/siteadmin/tenants/${id}/reactivate`, undefined, {
    successMessage: 'Business reactivated',
  })
  return res.data as TenantDetail
}

/** Fetch the business-admin account attached to a tenant (null if none). */
export async function getTenantAdmin(id: string): Promise<BusinessAdmin | null> {
  const res = await api.get<BusinessAdmin | null>(`/api/v1/siteadmin/tenants/${id}/admin`)
  return res.data as BusinessAdmin | null
}

/** List a tenant's branches (paginated) for the business summary view. */
export async function listTenantBranches(
  id: string,
  params: ITenantBranchListParams,
): Promise<ITenantBranchListResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit }
  if (params.search?.trim()) query.search = params.search.trim()

  const res = await api.get<ITenantBranch[]>(`/api/v1/siteadmin/tenants/${id}/branches`, { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as ITenantBranch[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

/** Fetch a tenant's Business Configuration (defaults created on first access). */
export async function getTenantConfiguration(id: string): Promise<TenantConfiguration> {
  const res = await api.get<TenantConfiguration>(`/api/v1/siteadmin/tenants/${id}/configuration`)
  return res.data as TenantConfiguration
}

/** Update (upsert) a tenant's Business Configuration. */
export async function updateTenantConfiguration(
  id: string,
  body: Record<string, unknown>,
): Promise<TenantConfiguration> {
  const res = await api.put(`/api/v1/siteadmin/tenants/${id}/configuration`, body, {
    successMessage: 'Configuration saved',
  })
  return res.data as TenantConfiguration
}

/** Fetch a tenant's Business Settings (defaults created on first access). */
export async function getTenantSettings(id: string): Promise<TenantSetting> {
  const res = await api.get<TenantSetting>(`/api/v1/siteadmin/tenants/${id}/settings`)
  return res.data as TenantSetting
}

/** Update (upsert) a tenant's Business Settings. */
export async function updateTenantSettings(
  id: string,
  body: Record<string, unknown>,
): Promise<TenantSetting> {
  const res = await api.put(`/api/v1/siteadmin/tenants/${id}/settings`, body, {
    successMessage: 'Settings saved',
  })
  return res.data as TenantSetting
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
