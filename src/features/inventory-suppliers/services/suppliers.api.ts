import { inventoryApi } from '@/shared/services/inventory-api'
import type {
  ISupplier,
  ISupplierForm,
  ISupplierListParams,
  ISupplierListResult,
} from '../interfaces'

const BASE = '/inventory-api/v1/master-suppliers'

/** Convert the string-based form into the backend's typed payload. */
function toPayload(form: ISupplierForm): Record<string, unknown> {
  const str = (v: string) => (v.trim() === '' ? undefined : v.trim())
  return {
    company: str(form.company),
    name: form.name.trim(),
    email: str(form.email),
    phone: str(form.phone),
    address: str(form.address),
    city: str(form.city),
    state: str(form.state),
    postalCode: str(form.postalCode),
    country: str(form.country),
    vatNo: str(form.vatNo),
    isActive: form.isActive,
  }
}

/** List suppliers (SiteAdmin view — active + inactive). */
export async function listSuppliers(
  params: ISupplierListParams,
): Promise<ISupplierListResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await inventoryApi.get<ISupplier[]>(BASE, { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as ISupplier[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

export async function createSupplier(form: ISupplierForm): Promise<unknown> {
  const res = await inventoryApi.post(BASE, toPayload(form), {
    successMessage: 'Supplier created',
  })
  return res.data
}

export async function updateSupplier(id: string, form: ISupplierForm): Promise<unknown> {
  const res = await inventoryApi.patch(`${BASE}/${id}`, toPayload(form), {
    successMessage: 'Supplier updated',
  })
  return res.data
}

export async function deleteSupplier(id: string): Promise<unknown> {
  const res = await inventoryApi.delete(`${BASE}/${id}`, {
    successMessage: 'Supplier removed',
  })
  return res.data
}
