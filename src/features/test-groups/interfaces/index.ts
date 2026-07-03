import type { SelectOption } from '@/shared/ui'
import type { TestGroupListRow } from '@/entities/test-group'

/* Rich UI Test Group model — the form edits this shape; it is mapped to/from the
   backend entity/DTO in ../utils/mapping.ts. Lab tests are held as
   `SelectOption`s so they bind directly to the multi `PaginatedSelect`. */
export interface TestGroup {
  id: string
  groupName: string
  labTests: SelectOption[]
}

export interface ListTestGroupsParams {
  page?: number
  limit?: number
  search?: string
}

export interface ListTestGroupsResult {
  rows: TestGroupListRow[]
  total: number
  totalPages: number
  page: number
}
