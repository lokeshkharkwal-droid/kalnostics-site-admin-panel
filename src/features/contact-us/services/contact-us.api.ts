import { api } from '@/shared/services/api'
import type {
  ContactSubmissionRow,
  IContactListParams,
  IContactListResult,
} from '../interfaces'

const BASE = '/api/v1/siteadmin/contact-us'

/**
 * List contact-us submissions from the SiteAdmin endpoint, with server-side
 * pagination, a free-text `search` (name / mobile / email), and a `from`/`to`
 * date range on `createdOn`. The shared axios interceptor attaches the
 * `siteadmin_token` (path starts with `/api/v1/siteadmin`) and unwraps the
 * `{ data, meta }` envelope (`meta` is hoisted onto the response).
 */
export async function listContactSubmissions(
  params: IContactListParams,
): Promise<IContactListResult> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to

  const res = await api.get<ContactSubmissionRow[]>(BASE, { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

/**
 * Soft-delete a contact-us submission. The interceptor shows the success toast.
 */
export async function deleteContactSubmission(
  id: string,
): Promise<ContactSubmissionRow> {
  const res = await api.delete<ContactSubmissionRow>(`${BASE}/${id}`, {
    successMessage: 'Submission deleted',
  })
  return res.data
}
