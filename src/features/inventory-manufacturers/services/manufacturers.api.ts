import { inventoryApi } from '@/shared/services/inventory-api'
import type {
  IManufacturer,
  IManufacturerForm,
  IManufacturerListParams,
  IManufacturerListResult,
} from '../interfaces'

const BASE = '/inventory-api/api/v1/master-manufacturers'

/** Convert the string-based form into the backend's typed payload. */
function toPayload(form: IManufacturerForm): Record<string, unknown> {
  const str = (v: string) => (v.trim() === '' ? null : v.trim())
  return {
    logoUrl: str(form.logoUrl),
    company: form.company.trim(),
    name: form.name.trim(),
    vatNo: str(form.vatNo),
    email: str(form.email),
    phone: str(form.phone),
    address: str(form.address),
    city: str(form.city),
    state: str(form.state),
    postalCode: str(form.postalCode),
    country: str(form.country),
    invoiceFooter: str(form.invoiceFooter),
    cf1: str(form.cf1),
    cf2: str(form.cf2),
    cf3: str(form.cf3),
    cf4: str(form.cf4),
    cf5: str(form.cf5),
    cf6: str(form.cf6),
    isActive: form.isActive,
  }
}

/** List manufacturers (SiteAdmin view — active + inactive). */
export async function listManufacturers(
  params: IManufacturerListParams,
): Promise<IManufacturerListResult> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit }
  if (params.search?.trim()) query.search = params.search.trim()
  const res = await inventoryApi.get<IManufacturer[]>(BASE, { params: query })
  const meta = (res as { meta?: { total?: number; totalPages?: number } }).meta ?? {}
  const rows = res.data as IManufacturer[]
  return { rows, total: meta.total ?? rows.length, totalPages: meta.totalPages ?? 1 }
}

export async function createManufacturer(form: IManufacturerForm): Promise<unknown> {
  const res = await inventoryApi.post(BASE, toPayload(form), {
    successMessage: 'Manufacturer created',
  })
  return res.data
}

export async function updateManufacturer(
  id: string,
  form: IManufacturerForm,
): Promise<unknown> {
  const res = await inventoryApi.patch(`${BASE}/${id}`, toPayload(form), {
    successMessage: 'Manufacturer updated',
  })
  return res.data
}

export async function deleteManufacturer(id: string): Promise<unknown> {
  const res = await inventoryApi.delete(`${BASE}/${id}`, {
    successMessage: 'Manufacturer removed',
  })
  return res.data
}
