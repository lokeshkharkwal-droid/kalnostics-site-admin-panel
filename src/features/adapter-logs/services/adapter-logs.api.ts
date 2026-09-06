import { api } from '@/shared/services/api'
import type {
  AdapterLogRecord,
  IAdapterLogsListParams,
  IAdapterLogsListResult,
} from '../interfaces'

/**
 * List adapter logs across all businesses (or one via `tenantId`) from the
 * SiteAdmin cross-tenant endpoint (`/siteadmin/adapter-logs`), with server-side
 * pagination, free-text search, action/status filters, and a `from`/`to` date
 * range. The shared axios interceptor attaches the `siteadmin_token` (path
 * starts with `/api/v1/siteadmin`) and unwraps the `{ data, meta }` envelope
 * (`meta` is hoisted onto the response).
 */
export async function listAdapterLogs(
  params: IAdapterLogsListParams,
): Promise<IAdapterLogsListResult> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.action) query.action = params.action
  if (params.status) query.status = params.status
  if (params.tenantId) query.tenantId = params.tenantId
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to

  const res = await api.get<AdapterLogRecord[]>('/api/v1/siteadmin/adapter-logs', {
    params: query,
  })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as AdapterLogRecord[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}
