/** SiteAdmin roles, lowest → highest privilege. Cumulative hierarchy. */
export type SiteAdminRole = 'content_admin' | 'operations_admin' | 'full_admin' | 'super_owner'

/** A managed SiteAdmin account as returned by the SiteAdmin users endpoint. */
export interface SiteAdminUser {
  id: string
  firstName: string
  lastName: string | null
  email: string
  role: SiteAdminRole
  isActive: boolean
  lastLoginAt: string | null
  lastLoginIp: string | null
  createdAt: string
}
