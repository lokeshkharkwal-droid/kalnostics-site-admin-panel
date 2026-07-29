/**
 * Audit-log module value (mirrors the backend `AuditModule` Prisma enum). Kept as
 * a string union so the FE stays decoupled from the generated Prisma client.
 */
export type AuditModuleValue =
  | 'USER'
  | 'BRANCH'
  | 'SCHEDULE'
  | 'TENANT'
  | 'DEPARTMENT'
  | 'CATEGORY'
  | 'SUB_CATEGORY'
  | 'MASTER_DATA'
  | 'LAB_TEST'
  | 'LAB_PANEL'
  | 'OUTSOURCE_CENTER'
  | 'DOCTOR'
  | 'REFERRAL_PANEL'
  | 'REFERRAL_PANEL_SETTINGS'
  | 'REFERRAL_DOCTOR'
  | 'EXTERNAL_REFERRAL'
  | 'INTERNAL_REFERRAL'
  | 'MACHINE'
  | 'DOCUMENT'
  | 'TEMPLATE'
  | 'PDF_REPORT_TEMPLATE'
  | 'AUTH'
  | 'SITEADMIN'

/** Audit-log action (mirrors the backend `AuditAction` Prisma enum). */
export type AuditActionValue =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'OTHER'

/**
 * One audit-log row as returned by `GET /api/v1/siteadmin/audits` — the raw audit
 * fields plus SiteAdmin enrichment (`actorName`, `actorUsername`, `tenantName`).
 */
export interface AuditRecord {
  id: string
  tenantId: string
  branchId: string | null
  module: AuditModuleValue
  action: AuditActionValue
  description: string
  actorPersonId: string
  actorRoleKey: string | null
  actorRoleLabel: string | null
  ipAddress: string | null
  resourceId: string | null
  metadata: unknown
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  // SiteAdmin enrichment
  actorName: string | null
  actorUsername: string | null
  tenantName: string | null
}

/** Query params for the SiteAdmin audit list (all optional except pagination). */
export interface IAuditListParams {
  page: number
  limit: number
  search?: string
  module?: AuditModuleValue | ''
  action?: AuditActionValue | ''
  tenantId?: string
  from?: string
  to?: string
}

/** Normalised list result (pagination hoisted out of the `meta` envelope). */
export interface IAuditListResult {
  rows: AuditRecord[]
  total: number
  totalPages: number
}
