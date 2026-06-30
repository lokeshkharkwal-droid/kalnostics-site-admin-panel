import type { BranchType } from '@/shared/constants/branch-modules'
import type { SelectOption } from '@/shared/ui'
import type { SubCategoryListRow, SubCategoryType } from '@/entities/sub-category'

/* Rich UI Sub-Category model — edited by the form, mapped to/from the backend in
   ../utils/mapping.ts. Parents are carried as SelectOptions so the dropdowns
   render without an extra fetch. At most one parent is set (matches the type). */
export interface SubCategory {
  id: string
  name: string
  shortName: string
  description: string
  code: string
  isActive: boolean
  moduleMapping: BranchType[]
  subCategoryType: SubCategoryType
  department: SelectOption | null
  category: SelectOption | null
}

export type StatusFilter = '' | 'ACTIVE' | 'INACTIVE'

/** Human labels for the `subCategoryType` enum (Type column + form select). */
export const SUB_CATEGORY_TYPE_LABELS: Record<SubCategoryType, string> = {
  INDEPENDENT: 'Independent',
  UNDER_DEPARTMENT: 'Under Department',
  UNDER_CATEGORY: 'Under Category',
}

export interface ListSubCategoriesParams {
  page?: number
  limit?: number
  search?: string
  status?: StatusFilter
}

export interface ListSubCategoriesResult {
  rows: SubCategoryListRow[]
  total: number
  totalPages: number
  page: number
}
