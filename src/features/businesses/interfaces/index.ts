import type { Dispatch, SetStateAction, ReactNode, FormEvent } from 'react'
import type { Tenant, TenantDetail } from '@/entities/tenant'
import type { SelectOption } from '@/shared/ui'

// ── Form state ──────────────────────────────────────────────────────────────

export interface ICreateTenantForm {
  name: string
  email: string
  phoneCountryCode: string
  phone: string
  shortName: string
  addressLine: string
  pincode: string
  country: SelectOption | null
  state: SelectOption | null
  city: SelectOption | null
  area: SelectOption | null
  logoUrl: string
  photoUrl: string
  timezone: string
  currency: string
  adminFirstName: string
  adminMiddleName: string
  adminLastName: string
  adminPhoneCountryCode: string
  adminPhone: string
  adminEmail: string
  adminPassword: string
}

export interface IEditForm {
  name: string
  email: string
  phoneCountryCode: string
  phone: string
  shortName: string
  addressLine: string
  pincode: string
  country: SelectOption | null
  state: SelectOption | null
  city: SelectOption | null
  area: SelectOption | null
  logoUrl: string
  photoUrl: string
  settings: {
    timezone: string
    currency: string
    date_format: string
    language: string
  }
}

/** Form state for the Business Configuration modal. */
export interface IConfigForm {
  siteAdminUrl: string
  siteTitle: string
  logoPath: string
  logoLink: string
  template: string
  theme: 'LIGHT' | 'DARK'
  patientOrderUrl: string
  maxOrdersPerDayPerBranch: string
  maxUsersAllowed: string
}

/** Form state for the Business Settings modal. */
export interface ISettingsForm {
  isExternalDoctorOutReferralAllowed: boolean
  isExternalDoctorInReferralAllowed: boolean
  isExternalHospitalOutReferralAllowed: boolean
  isExternalHospitalInReferralAllowed: boolean
  isPatientOrderPaymentAllowed: boolean
  isCmsOrderBillGenerationEnabled: boolean
  referralPgCommissionType: 'EXCLUSIVE' | 'INCLUSIVE'
  patientPgCommissionType: 'EXCLUSIVE' | 'INCLUSIVE'
  franchiseBranchPgCommissionType: 'EXCLUSIVE' | 'INCLUSIVE'
  canPatientWalletGoNegative: boolean
}

// ── API request/response shapes ───────────────────────────────────────────────

export interface ITenantListParams {
  page: number
  limit: number
  search?: string
  status?: string
}

export interface ITenantListResult {
  rows: Tenant[]
  total: number
  totalPages: number
}

export interface ICreateTenantResult {
  tenant: Tenant
  adminPhone: string
}

// ── Tenant branches (SiteAdmin summary) ──────────────────────────────────────

export interface ITenantBranch {
  id: string
  name: string
  code: string
  branchType: string
  status: string
  city: string | null
  phone: string | null
  managerName: string | null
}

export interface ITenantBranchListParams {
  page: number
  limit: number
  search?: string
}

export interface ITenantBranchListResult {
  rows: ITenantBranch[]
  total: number
  totalPages: number
}

export interface ICreatedCredentials {
  adminPhone: string
  /** The password the SiteAdmin chose while creating the business. */
  password: string
  businessName: string
}

export interface IResetCredentials {
  adminPhone: string
  tempPassword: string
}

// ── Component props ───────────────────────────────────────────────────────────

export interface ISectionTitleProps {
  children: ReactNode
}

export interface IReadFieldProps {
  label: string
  value: string | null | undefined
}

export interface ICreateBusinessModalProps {
  onClose: () => void
  onCreated: (creds: ICreatedCredentials) => void
}

export interface ICredentialsCardProps {
  creds: ICreatedCredentials
  onDone: () => void
}

/** Shared props for the editable General-Info and Settings tabs. */
export interface IBusinessEditTabProps {
  tenant: TenantDetail
  editing: boolean
  form: IEditForm | null
  setForm: Dispatch<SetStateAction<IEditForm | null>>
  updating: boolean
  saveError: string
  onSave: (e: FormEvent) => void
  onCancel: () => void
}

export interface ISubscriptionTabProps {
  tenant: TenantDetail
}

export interface IAdminAccountTabProps {
  tenantId: string
  tenantName: string
}
