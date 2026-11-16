/** Adapter action (mirrors the backend `AdapterAction` Prisma enum). */
export type AdapterActionValue = 'ORDERS' | 'SUBMIT_RESULT' | 'OTHER'

/**
 * One adapter-log row as returned by `GET /api/v1/siteadmin/adapter-logs` — an
 * EMI adapter transaction (emi/orders, emi/submitResult), enriched with the
 * owning business name (`tenantName`) for the cross-tenant view.
 */
export interface AdapterLogRecord {
  id: string
  tenantId: string
  tenantName: string | null
  branchId: string | null
  token: string | null
  action: AdapterActionValue
  status: string | null
  statusCode: number | null
  sourceIpAddress: string | null
  request: string | null
  response: string | null
  createdAt: string
}

/** Query params for the SiteAdmin adapter-log list (all optional except pagination). */
export interface IAdapterLogsListParams {
  page: number
  limit: number
  search?: string
  action?: AdapterActionValue | ''
  status?: string
  tenantId?: string
  from?: string
  to?: string
}

/** Normalised list result (pagination hoisted out of the `meta` envelope). */
export interface IAdapterLogsListResult {
  rows: AdapterLogRecord[]
  total: number
  totalPages: number
}
