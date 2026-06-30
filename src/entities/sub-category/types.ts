/* ═══════════════════════════════════════════════════════════════════════
   Backend-facing Sub-Category contract (mirrors kalnostics-new SubCategory model
   + SiteAdmin template DTOs). Every Site Admin sub-category is a global
   SITE_ADMIN template (`tenantId` NULL, `source = SITE_ADMIN`). `code` is
   system-generated (`SA-SubCat-{n}`, immutable). A sub-category is INDEPENDENT,
   UNDER_DEPARTMENT (`departmentId` set) or UNDER_CATEGORY (`categoryId` set).
   ═══════════════════════════════════════════════════════════════════════ */

import type { BranchType } from '@/shared/constants/branch-modules'
import type { DataSource } from '@/entities/department'

export type SubCategoryType = 'INDEPENDENT' | 'UNDER_DEPARTMENT' | 'UNDER_CATEGORY'

export interface SubCategoryEntity {
  id: string
  tenantId: string | null
  name: string
  description: string | null
  code: string
  shortName: string
  source: DataSource
  clonedFromId: string | null
  isActive: boolean
  subCategoryType: SubCategoryType
  departmentId: string | null
  categoryId: string | null
  moduleMapping: BranchType[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type SubCategoryListRow = SubCategoryEntity

/** Create/update payload (no `code`). Parent id matches the chosen type. */
export interface SubCategoryWriteDto {
  name: string
  shortName: string
  description?: string
  isActive?: boolean
  subCategoryType: SubCategoryType
  departmentId?: string
  categoryId?: string
  moduleMapping: BranchType[]
}
