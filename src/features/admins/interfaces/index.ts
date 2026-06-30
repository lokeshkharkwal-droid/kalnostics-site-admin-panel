import type { ReactNode } from 'react'
import type { SiteAdminRole, SiteAdminUser } from '@/entities/siteadmin-user'

// ── Form state ──────────────────────────────────────────────────────────────

export interface ICreateAdminForm {
  firstName: string
  lastName: string
  email: string
  password: string
  role: SiteAdminRole
}

// ── API request/response shapes ───────────────────────────────────────────────

export interface IAdminListParams {
  page: number
  limit: number
  search?: string
  role?: SiteAdminRole | ''
  status?: 'active' | 'inactive' | ''
}

export interface IAdminListResult {
  rows: SiteAdminUser[]
  total: number
  totalPages: number
}

// ── Component props ───────────────────────────────────────────────────────────

export interface IAdminsTableProps {
  admins: SiteAdminUser[]
  onChangePassword: (admin: SiteAdminUser) => void
  onDeactivate: (admin: SiteAdminUser) => void
  onActivate: (admin: SiteAdminUser) => void
}

export interface ICreateAdminModalProps {
  onClose: () => void
}

export interface IChangePasswordModalProps {
  admin: SiteAdminUser
  onClose: () => void
}

export interface IConfirmDialogProps {
  title: string
  message: ReactNode
  confirmLabel: string
  confirmVariant?: 'primary' | 'danger'
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}
