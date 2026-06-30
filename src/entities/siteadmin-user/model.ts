import type { SiteAdminRole } from './types'

/** Role hierarchy — higher number = more permissions. */
export const ROLE_LEVELS: Record<SiteAdminRole, number> = {
  content_admin:    1,
  operations_admin: 2,
  full_admin:       3,
  super_owner:      4,
}

/**
 * Normalise the role string coming from the backend. kalnostics-new emits
 * Prisma enum values in SCREAMING_SNAKE_CASE (e.g. "SUPER_OWNER"), but this UI
 * works in lower_snake_case ("super_owner") throughout. Lowercase on the way in.
 */
export function normalizeRole(role: string): SiteAdminRole {
  return String(role).toLowerCase() as SiteAdminRole
}

/** Human-readable role labels. */
export const ROLE_LABEL: Record<SiteAdminRole, string> = {
  content_admin:    'Content Admin',
  operations_admin: 'Operations Admin',
  full_admin:       'Full Admin',
  super_owner:      'Super Owner',
}

/** Badge variant per role. */
export const ROLE_VARIANT: Record<SiteAdminRole, 'default' | 'info' | 'warning' | 'danger'> = {
  content_admin:    'default',
  operations_admin: 'info',
  full_admin:       'warning',
  super_owner:      'danger',
}

/** Roles available when creating a sub-admin (super_owner cannot be created via API). */
export const CREATABLE_ROLES: SiteAdminRole[] = ['content_admin', 'operations_admin', 'full_admin']
