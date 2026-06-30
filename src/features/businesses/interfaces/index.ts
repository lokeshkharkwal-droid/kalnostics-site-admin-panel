import type { Dispatch, SetStateAction, ReactNode, FormEvent } from 'react'
import type { Tenant, TenantDetail } from '@/entities/tenant'

// ── Form state ──────────────────────────────────────────────────────────────

export interface ICreateTenantForm {
  name: string
  slug: string
  email: string
  phoneCountryCode: string
  phone: string
  adminFirstName: string
  adminLastName: string
  adminPhoneCountryCode: string
  adminPhone: string
  adminEmail: string
}

export interface IEditForm {
  name: string
  email: string
  phoneCountryCode: string
  phone: string
  mrnPrefix: string
  settings: {
    timezone: string
    currency: string
    date_format: string
    language: string
    app_name: string
  }
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
  tempPassword: string
}

export interface ICreatedCredentials {
  adminPhone: string
  tempPassword: string
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
