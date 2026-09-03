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
  time_format: string
  language: string
  logo_url?: string
  primary_color?: string
  app_name?: string
}

/** A resolved location relation (country/state/city/area) on a tenant detail. */
export interface TenantLocationRef {
  id: string
  name: string
}

/** The full tenant record returned by the SiteAdmin detail endpoint. */
export interface TenantDetail {
  id: string
  name: string
  slug: string
  customDomain: string | null
  email: string | null
  phone: string | null
  shortName: string | null
  address: Record<string, unknown> | null
  addressLine: string | null
  pincode: string | null
  countryId: string | null
  stateId: string | null
  cityId: string | null
  areaId: string | null
  country: TenantLocationRef | null
  state: TenantLocationRef | null
  city: TenantLocationRef | null
  area: TenantLocationRef | null
  logoUrl: string | null
  photoUrl: string | null
  subscriptionStatus: string
  subscriptionPlanId: string | null
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  gracePeriodEndsAt: string | null
  settings: TenantSettings
  isActive: boolean
  mrnPrefix: string | null
  createdBy: string | null
  updatedBy: string | null
  createdByName: string | null
  updatedByName: string | null
  createdAt: string
  updatedAt: string
}

/** UI theme for a business (TenantConfiguration.theme). */
export type Theme = 'LIGHT' | 'DARK'

/** Payment-gateway commission type. */
export type PgCommissionType = 'EXCLUSIVE' | 'INCLUSIVE'

/** Business Configuration — SiteAdmin-managed site/branding/limit settings. */
export interface TenantConfiguration {
  id: string
  tenantId: string
  siteAdminUrl: string | null
  siteTitle: string | null
  logoPath: string | null
  logoLink: string | null
  template: string | null
  theme: Theme
  patientOrderUrl: string | null
  maxOrdersPerDayPerBranch: number | null
  maxUsersAllowed: number | null
  createdAt: string
  updatedAt: string
}

/** Business Settings — SiteAdmin-managed referral/payment/commission/wallet rules. */
export interface TenantSetting {
  id: string
  tenantId: string
  isExternalDoctorOutReferralAllowed: boolean
  isExternalDoctorInReferralAllowed: boolean
  isExternalHospitalOutReferralAllowed: boolean
  isExternalHospitalInReferralAllowed: boolean
  isPatientOrderPaymentAllowed: boolean
  isCmsOrderBillGenerationEnabled: boolean
  referralPgCommissionType: PgCommissionType
  patientPgCommissionType: PgCommissionType
  franchiseBranchPgCommissionType: PgCommissionType
  canPatientWalletGoNegative: boolean
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
