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

/**
 * Builds id→name lookups for resolving proforma line items (which store only
 * `masterProductId` / `labTestId`, no names) into human-readable labels.
 *
 * - products: `GET /inventory-api/v1/master-products/manage` (first 500).
 * - labTests: `GET /api/v1/siteadmin/lab-tests/options` (returns all).
 *
 * Mirrors the envelope-unwrapping used elsewhere in this file: the {@link api}
 * client unwraps `{ success, data, meta }`, so `res.data` is the array.
 * Returns empty maps gracefully when a source has no rows.
 */
export async function fetchProformaLabelMaps(): Promise<{
  products: Map<string, string>
  labTests: Map<string, string>
}> {
  const [productsRes, labTestsRes] = await Promise.all([
    api.get<{ id: string; name: string }[]>('/inventory-api/v1/master-products/manage', {
      params: { page: 1, limit: 100 },
    }),
    api.get<{ id: string; name: string }[]>('/api/v1/siteadmin/lab-tests/options'),
  ])

  const productRows = (productsRes.data as { id: string; name: string }[]) ?? []
  const labTestRows = (labTestsRes.data as { id: string; name: string }[]) ?? []

  const products = new Map<string, string>()
  for (const p of productRows) products.set(p.id, p.name)
  const labTests = new Map<string, string>()
  for (const t of labTestRows) labTests.set(t.id, t.name)

  return { products, labTests }
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
