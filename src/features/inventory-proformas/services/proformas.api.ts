import { api } from '@/shared/services/api'

/**
 * SiteAdmin-managed inventory master proformas. These live on the **inventory
 * backend**, reached through the shared nginx `/inventory-api` route; the main
 * {@link api} client attaches the SiteAdmin token automatically for
 * `/inventory-api/*` paths.
 */
const BASE = '/inventory-api/v1/master-proformas'

/** A proforma line item (a master product + quantity). */
export interface IProformaItem {
  id?: string
  masterProductId?: string | null
  labTestId?: string | null
  quantity: number
}

/** A proforma as returned by the list / detail endpoints. */
export interface IProforma {
  id: string
  name: string
  date: string
  status: 'ACTIVE' | 'INACTIVE'
  notes: string | null
  items?: IProformaItem[]
  _count?: { items: number }
  createdAt: string
}

export interface IProformaListResult {
  rows: IProforma[]
  total: number
  totalPages: number
}

/** Payload sent to create/update a proforma. */
export interface IProformaPayload {
  name: string
  date?: string
  status?: 'ACTIVE' | 'INACTIVE'
  notes?: string
  items?: { masterProductId?: string; labTestId?: string; quantity: number }[]
}

/**
 * Lab-test options for a proforma line, sourced from the kalnostics-new SiteAdmin
 * lab-test catalogue (`GET /api/v1/siteadmin/lab-tests/options`). Shaped for
 * `PaginatedSelect` (client-side filtered — the options endpoint returns all).
 */
export async function fetchLabTestPage(params: {
  page: number
  search: string
  pageSize: number
}): Promise<{ data: { id: string; name: string }[]; meta: { page: number; totalPages: number } }> {
  const res = await api.get<{ id: string; name: string }[]>(
    '/api/v1/siteadmin/lab-tests/options',
  )
  const all = (res.data as { id: string; name: string }[]) ?? []
  const q = params.search.trim().toLowerCase()
  const filtered = q ? all.filter((t) => t.name.toLowerCase().includes(q)) : all
  return { data: filtered, meta: { page: 1, totalPages: 1 } }
}

export async function listProformas(params: {
  page: number
  limit: number
  search?: string
}): Promise<IProformaListResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await api.get<IProforma[]>(BASE, { params: query })
  const rows = res.data as IProforma[]
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

export async function getProforma(id: string): Promise<IProforma> {
  const res = await api.get<IProforma>(`${BASE}/${id}`)
  return res.data as IProforma
}

export async function createProforma(payload: IProformaPayload): Promise<IProforma> {
  const res = await api.post<IProforma>(BASE, payload, { successMessage: 'Proforma created' })
  return res.data as IProforma
}

export async function updateProforma(id: string, payload: IProformaPayload): Promise<IProforma> {
  const res = await api.patch<IProforma>(`${BASE}/${id}`, payload, {
    successMessage: 'Proforma updated',
  })
  return res.data as IProforma
}

export async function deleteProforma(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`, { successMessage: 'Proforma removed' })
}
