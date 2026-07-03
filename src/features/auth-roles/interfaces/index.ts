import type { BranchType } from '@/shared/constants/branch-modules'

/** A global auth role from `/siteadmin/roles`. */
export interface AuthRole {
  id: string
  key: string
  name: string
  description: string | null
  /** Seeded built-in role: name/key immutable, only description/status editable. */
  isSystem: boolean
  isActive: boolean
  allowedBranchTypes: BranchType[]
  createdAt: string
}

// ── API request/response shapes ───────────────────────────────────────────────

export interface IRoleListParams {
  page: number
  limit: number
  search?: string
  status?: 'active' | 'inactive' | ''
}

export interface IRoleListResult {
  rows: AuthRole[]
  total: number
  totalPages: number
}

/** Editable role fields (create + update share the same shape). */
export interface IRoleForm {
  name: string
  description: string
  isActive: boolean
  allowedBranchTypes: BranchType[]
}

// ── Component props ───────────────────────────────────────────────────────────

export type RoleModalMode = 'create' | 'edit' | 'view'

export interface IAuthRolesTableProps {
  roles: AuthRole[]
  onView: (role: AuthRole) => void
  onEdit: (role: AuthRole) => void
}

export interface IRoleFormModalProps {
  mode: RoleModalMode
  /** The role being viewed/edited; omitted for create. */
  role?: AuthRole
  onClose: () => void
}
