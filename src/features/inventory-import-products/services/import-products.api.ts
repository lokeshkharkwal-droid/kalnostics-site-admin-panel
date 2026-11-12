import { api } from '@/shared/services/api'

/**
 * Inventory master products live on the **inventory backend**, reached through
 * the shared nginx `/inventory-api` route; the main {@link api} client attaches
 * the SiteAdmin token automatically for `/inventory-api/*` paths.
 *
 * NOTE: the inventory backend's only `/master-products/import` route is the
 * **tenant-side** one (it imports copies of existing masters by id, using a
 * business JWT) — there is no SiteAdmin bulk-CSV import endpoint. So SiteAdmin
 * CSV import posts each parsed row to the SiteAdmin create route
 * `POST /master-products/manage` instead.
 */
const MANAGE_BASE = '/inventory-api/v1/master-products/manage'

/** A parsed CSV row ready to create (all values are raw strings from the file). */
export interface ImportRow {
  code: string
  name: string
  category: string
  subCategory: string
  unit: string
  brand: string
  cost: string
  price: string
  hsnCode: string
  taxName: string
  taxRate: string
}

/** The CSV header row (also used to generate the downloadable sample). */
export const IMPORT_COLUMNS: (keyof ImportRow)[] = [
  'code',
  'name',
  'category',
  'subCategory',
  'unit',
  'brand',
  'cost',
  'price',
  'hsnCode',
  'taxName',
  'taxRate',
]

/** Convert a raw CSV row into the backend create payload (dropping empties). */
function toPayload(row: ImportRow): Record<string, unknown> {
  const str = (v: string) => (v.trim() === '' ? undefined : v.trim())
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
  return {
    name: row.name.trim(),
    code: str(row.code),
    category: str(row.category),
    subCategory: str(row.subCategory),
    unit: str(row.unit),
    brand: str(row.brand),
    cost: num(row.cost),
    price: num(row.price),
    hsnCode: str(row.hsnCode),
    taxName: str(row.taxName),
    taxRate: num(row.taxRate),
    isImportable: true,
    isActive: true,
  }
}

/** Create one master product from a parsed CSV row. */
export async function createFromRow(row: ImportRow): Promise<void> {
  await api.post(MANAGE_BASE, toPayload(row), {
    skipSuccessToast: true,
    skipErrorToast: true,
  })
}
