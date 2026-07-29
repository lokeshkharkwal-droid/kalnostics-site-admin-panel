import type { SelectOption } from '@/shared/ui'
import type { EquipmentListRow } from '@/entities/equipment'

/* Rich UI Equipment model — the form edits this shape; it is mapped to/from the
   backend entity/DTO in ../utils/mapping.ts. Lab tests are held as
   `SelectOption`s so they bind directly to the multi `PaginatedSelect`. */
export interface Equipment {
  id: string
  name: string
  code: string
  description: string
  setupDocument: string
  labConfigDocument: string
  adopterDocument: string
  labTests: SelectOption[]
}

export interface ListEquipmentParams {
  page?: number
  limit?: number
  search?: string
}

export interface ListEquipmentResult {
  rows: EquipmentListRow[]
  total: number
  totalPages: number
  page: number
}
