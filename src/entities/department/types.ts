/* ═══════════════════════════════════════════════════════════════════════
   Backend-facing Department contract (mirrors kalnostics-new Department model +
   SiteAdmin template DTOs). In the Site Admin portal every department is a
   global SITE_ADMIN template: `tenantId` is NULL and `source = SITE_ADMIN`.
   The write DTO omits `code` (system-generated `SA-Dep-{n}`, immutable) and
   person mappings (templates carry none).
   ═══════════════════════════════════════════════════════════════════════ */

import type { BranchType } from '@/shared/constants/branch-modules'

export type DataSource = 'TENANT' | 'SITE_ADMIN'

export interface DepartmentEntity {
  id: string
  tenantId: string | null
  name: string
  description: string | null
  code: string
  shortName: string
  source: DataSource
  clonedFromId: string | null
  isActive: boolean
  moduleMapping: BranchType[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/** List projection — same core fields as the entity. */
export type DepartmentListRow = DepartmentEntity

/** Create/update payload (no `code` — system-generated & immutable). */
export interface DepartmentWriteDto {
  name: string
  shortName: string
  description?: string
  isActive?: boolean
  moduleMapping: BranchType[]
}
