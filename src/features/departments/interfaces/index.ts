import type { BranchType } from '@/shared/constants/branch-modules'
import type { DepartmentListRow } from '@/entities/department'

/* Rich UI Department model — the form edits this shape; it is mapped to/from the
   backend entity/DTO in ../utils/mapping.ts. */
export interface Department {
  id: string
  name: string
  shortName: string
  description: string
  /** System-generated, immutable. Empty for a not-yet-created department. */
  code: string
  isActive: boolean
  moduleMapping: BranchType[]
}

export type StatusFilter = '' | 'ACTIVE' | 'INACTIVE'

export interface ListDepartmentsParams {
  page?: number
  limit?: number
  search?: string
  status?: StatusFilter
}

export interface ListDepartmentsResult {
  rows: DepartmentListRow[]
  total: number
  totalPages: number
  page: number
}
