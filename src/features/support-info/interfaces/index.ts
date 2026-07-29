export type SupportTenantType = 'BUSINESS' | 'BRANCH'
export type SupportStatus = 'ACTIVE' | 'INACTIVE'
export type StatusFilter = '' | SupportStatus

/** Row shape returned by the list endpoint (no `helpContent`). */
export interface SupportInfoListRow {
  id: string
  metaType: string
  code: string | null
  title: string
  tenantType: SupportTenantType
  status: SupportStatus
  updatedAt: string
}

/** Full record returned by `GET /:id`. */
export interface SupportInfoEntity extends SupportInfoListRow {
  requestUrl: string | null
  helpContent: string
  createdAt: string
}

/** Create/update payload. `helpContent` carries the editor's HTML. */
export interface SupportInfoWriteDto {
  metaType: string
  code?: string
  title: string
  tenantType: SupportTenantType
  status: SupportStatus
  requestUrl?: string
  helpContent: string
}

/** Rich UI model the form edits; mapped to/from the entity/DTO in utils/mapping. */
export interface SupportInfo {
  id: string
  metaType: string
  code: string
  title: string
  tenantType: SupportTenantType
  status: SupportStatus
  requestUrl: string
  help: string
}

export interface ListSupportInfoParams {
  page?: number
  limit?: number
  search?: string
  status?: StatusFilter
}

export interface ListSupportInfoResult {
  rows: SupportInfoListRow[]
  total: number
  totalPages: number
  page: number
}

export type FormMode = 'create' | 'edit' | 'view'
