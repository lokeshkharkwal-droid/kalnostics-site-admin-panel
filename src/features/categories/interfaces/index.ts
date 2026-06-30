import type { BranchType } from '@/shared/constants/branch-modules'
import type { SelectOption } from '@/shared/ui'
import type { CategoryListRow, CategoryType } from '@/entities/category'

/* Rich UI Category model — edited by the form, mapped to/from the backend in
   ../utils/mapping.ts. The parent department is carried as a SelectOption so the
   dropdown trigger/chip renders without an extra fetch. */
export interface Category {
  id: string
  name: string
  shortName: string
  description: string
  code: string
  isActive: boolean
  moduleMapping: BranchType[]
  categoryType: CategoryType
  /** Parent department (only for UNDER_DEPARTMENT). */
  department: SelectOption | null
}

export type StatusFilter = '' | 'ACTIVE' | 'INACTIVE'

/** Human labels for the `categoryType` enum (Type column + form select). */
export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  INDEPENDENT: 'Independent',
  UNDER_DEPARTMENT: 'Under Department',
}

export interface ListCategoriesParams {
  page?: number
  limit?: number
  search?: string
  status?: StatusFilter
}

export interface ListCategoriesResult {
  rows: CategoryListRow[]
  total: number
  totalPages: number
  page: number
}
