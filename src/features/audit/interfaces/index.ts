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
  | 'EQUIPMENT'
  | 'CONTACT_US'
  | 'SUPPORT_INFO'
  | 'AUTH_ROLE'
  | 'TEST_GROUP'
  | 'PAYMENT_RULE'
  | 'LOCATION'

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
 * One audit-log row as returned by `GET /api/v1/siteadmin/audits` — the merged
 * view over business (`scope: 'TENANT'`) and SiteAdmin (`scope: 'SITEADMIN'`)
 * audit trails, plus enrichment (`actorName`, `actorUsername`, `tenantName`).
 * For SiteAdmin rows `tenantId`/`tenantName` are null and the actor email fills
 * `actorName`/`actorUsername`.
 */
export interface AuditRecord {
  id: string
  scope: 'TENANT' | 'SITEADMIN'
  tenantId: string | null
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
  // Enrichment
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
