import { inventoryApi } from '@/shared/services/inventory-api'
import type {
  IMasterProduct,
  IMasterProductForm,
  IMasterProductListParams,
  IMasterProductListResult,
} from '../interfaces'

const BASE = '/api/v1/master-products/manage'

/** Convert the string-based form into the backend's typed payload. */
function toPayload(form: IMasterProductForm): Record<string, unknown> {
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
  const str = (v: string) => (v.trim() === '' ? undefined : v.trim())
  return {
    name: form.name.trim(),
    code: str(form.code),
    category: str(form.category),
    subCategory: str(form.subCategory),
    unit: str(form.unit),
    brand: str(form.brand),
    price: num(form.price),
    cost: num(form.cost),
    hsnCode: str(form.hsnCode),
    taxName: str(form.taxName),
    taxRate: num(form.taxRate),
    description: str(form.description),
    genericName: str(form.genericName),
    strength: str(form.strength),
    isImportable: form.isImportable,
    isActive: form.isActive,
  }
}

/** List master products (SiteAdmin view — active + inactive). */
export async function listMasterProducts(
  params: IMasterProductListParams,
): Promise<IMasterProductListResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await inventoryApi.get<IMasterProduct[]>(BASE, { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as IMasterProduct[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

export async function createMasterProduct(form: IMasterProductForm): Promise<unknown> {
  const res = await inventoryApi.post(BASE, toPayload(form), {
    successMessage: 'Master product created',
  })
  return res.data
}

export async function updateMasterProduct(
  id: string,
  form: IMasterProductForm,
): Promise<unknown> {
  const res = await inventoryApi.patch(`${BASE}/${id}`, toPayload(form), {
    successMessage: 'Master product updated',
  })
  return res.data
}

export async function deleteMasterProduct(id: string): Promise<unknown> {
  const res = await inventoryApi.delete(`${BASE}/${id}`, {
    successMessage: 'Master product removed',
  })
  return res.data
}
