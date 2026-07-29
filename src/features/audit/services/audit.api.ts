import { api } from '@/shared/services/api'
import type { AuditRecord, IAuditListParams, IAuditListResult } from '../interfaces'

/**
 * List audit logs across all businesses (or one via `tenantId`) from the SiteAdmin
 * cross-tenant endpoint (`/siteadmin/audits`), with server-side pagination,
 * search, module/action filters, and a `from`/`to` date range. The shared axios
 * interceptor attaches the `siteadmin_token` (path starts with `/api/v1/siteadmin`)
 * and unwraps the `{ data, meta }` envelope (`meta` is hoisted onto the response).
 */
export async function listAuditLogs(
  params: IAuditListParams,
): Promise<IAuditListResult> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.module) query.module = params.module
  if (params.action) query.action = params.action
  if (params.tenantId) query.tenantId = params.tenantId
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to

  const res = await api.get<AuditRecord[]>('/api/v1/siteadmin/audits', { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as AuditRecord[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}
