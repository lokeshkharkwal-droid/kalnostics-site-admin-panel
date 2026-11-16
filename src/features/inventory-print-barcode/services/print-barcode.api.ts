import { api } from '@/shared/services/api'
import type { PageResult } from '@/shared/ui'

/**
 * Inventory master products live on the **inventory backend**, reached through
 * the shared nginx `/inventory-api` route. The main {@link api} client attaches
 * the SiteAdmin token for `/inventory-api/*` paths automatically.
 */
const MANAGE_BASE = '/inventory-api/api/v1/master-products/manage'

/** A master product as returned by the SiteAdmin management list. */
export interface IPrintProduct {
  id: string
  name: string
  code: string | null
  category: string | null
  subCategory: string | null
  unit: string | null
  brand: string | null
  price: number
  cost: number
  description: string | null
  imageUrl?: string | null
}

/**
 * Fetch one page of master products in the shape {@link PaginatedSelect}
 * expects (used as the product picker).
 */
export async function fetchProductPage(params: {
  page: number
  search: string
  pageSize: number
}): Promise<PageResult> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.pageSize,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await api.get<IPrintProduct[]>(MANAGE_BASE, { params: query })
  const rows = res.data as IPrintProduct[]
  const meta = (res as { meta?: { page?: number; totalPages?: number } }).meta ?? {}
  return {
    data: rows.map((r) => ({ id: r.id, name: r.name })),
    meta: { page: meta.page ?? params.page, totalPages: meta.totalPages ?? 1 },
  }
}

/** Fetch a single master product's full detail (used to hydrate a picked row). */
export async function getProduct(id: string): Promise<IPrintProduct> {
  const res = await api.get<IPrintProduct>(`${MANAGE_BASE}/${id}`)
  return res.data as IPrintProduct
}
