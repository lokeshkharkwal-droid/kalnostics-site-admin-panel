/** A tenant (business) as returned by the SiteAdmin list endpoints. */
export interface Tenant {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  subscriptionStatus: string
  subscriptionPlanId: string | null
  isActive: boolean
  createdAt: string
}

/** Aggregate business counts for the SiteAdmin dashboard. */
export interface DashboardCounts {
  total: number
  active: number
  trial: number
  suspended: number
}

/** Locale & branding settings stored on a tenant. */
export interface TenantSettings {
  timezone: string
  currency: string
  date_format: string
  language: string
  logo_url?: string
  primary_color?: string
  app_name?: string
}

/** The full tenant record returned by the SiteAdmin detail endpoint. */
export interface TenantDetail {
  id: string
  name: string
  slug: string
  customDomain: string | null
  email: string | null
  phone: string | null
  address: Record<string, unknown> | null
  subscriptionStatus: string
  subscriptionPlanId: string | null
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  gracePeriodEndsAt: string | null
  settings: TenantSettings
  isActive: boolean
  mrnPrefix: string | null
  createdAt: string
  updatedAt: string
}

/** The business-admin account attached to a tenant. */
export interface BusinessAdmin {
  personId: string
  firstName: string
  lastName: string | null
  phone: string | null
  email: string | null
  platformMrn: string
  isActive: boolean
  isTempPassword: boolean
  lastLoginAt: string | null
}
