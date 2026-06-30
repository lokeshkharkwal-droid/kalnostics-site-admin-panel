/* ═══════════════════════════════════════════════════════════════════════
   Backend-facing Category contract (mirrors kalnostics-new Category model +
   SiteAdmin template DTOs). Every Site Admin category is a global SITE_ADMIN
   template (`tenantId` NULL, `source = SITE_ADMIN`). `code` is system-generated
   (`SA-Cat-{n}`, immutable). A category is INDEPENDENT or UNDER_DEPARTMENT
   (then `departmentId` references a SITE_ADMIN department template).
   ═══════════════════════════════════════════════════════════════════════ */

import type { BranchType } from '@/shared/constants/branch-modules'
import type { DataSource } from '@/entities/department'

export type CategoryType = 'INDEPENDENT' | 'UNDER_DEPARTMENT'

export interface CategoryEntity {
  id: string
  tenantId: string | null
  name: string
  description: string | null
  code: string
  shortName: string
  source: DataSource
  clonedFromId: string | null
  isActive: boolean
  categoryType: CategoryType
  departmentId: string | null
  moduleMapping: BranchType[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type CategoryListRow = CategoryEntity

/** Create/update payload (no `code`). `departmentId` only for UNDER_DEPARTMENT. */
export interface CategoryWriteDto {
  name: string
  shortName: string
  description?: string
  isActive?: boolean
  categoryType: CategoryType
  departmentId?: string
  moduleMapping: BranchType[]
}
