import { api } from '@/shared/services/api'
import { fetchManufacturerOptionsPage } from '@/features/inventory-master-products/services/master-products.api'

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
 *
 * The CSV layout mirrors the legacy EZ Health Track **`sample_product_import.csv`**
 * (29 columns) so files exported from either system are interchangeable.
 */
const MANAGE_BASE = '/inventory-api/api/v1/master-products/manage'

/** The field keys a parsed CSV row carries (one per legacy column). */
export type ImportFieldKey =
  | 'code'
  | 'name'
  | 'category'
  | 'unit'
  | 'packSize'
  | 'salesMethod'
  | 'packCost'
  | 'cost'
  | 'packMrp'
  | 'price'
  | 'alertQuantity'
  | 'taxName'
  | 'hsnCode'
  | 'taxMethod'
  | 'taxMethodPurchase'
  | 'subCategory'
  | 'variants'
  | 'cf1'
  | 'cf2'
  | 'cf3'
  | 'cf4'
  | 'cf5'
  | 'cf6'
  | 'cf7'
  | 'cf8'
  | 'cf9'
  | 'cf10'
  | 'cf11'
  | 'manufacturer'

/** A parsed CSV row ready to create (all values are raw strings from the file). */
export type ImportRow = Record<ImportFieldKey, string>

/** One CSV column: its header label (as written to the sample) and its field key. */
export interface ImportColumn {
  /** Header label — matched case-insensitively (and trimmed) when reading uploads. */
  header: string
  key: ImportFieldKey
}

/**
 * The CSV columns, in order, matching the legacy EZ Health Track
 * `sample_product_import.csv` header row exactly.
 */
export const IMPORT_COLUMNS: ImportColumn[] = [
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Category Code', key: 'category' },
  { header: 'Unit', key: 'unit' },
  { header: 'Pack Size', key: 'packSize' },
  { header: 'Sales Method', key: 'salesMethod' },
  { header: 'Pack Cost', key: 'packCost' },
  { header: 'Unit Cost', key: 'cost' },
  { header: 'Pack MRP', key: 'packMrp' },
  { header: 'Unit MRP', key: 'price' },
  { header: 'Alert Quantity', key: 'alertQuantity' },
  { header: 'Tax Rate Name', key: 'taxName' },
  { header: 'HSN Code', key: 'hsnCode' },
  { header: 'Tax Method Sales', key: 'taxMethod' },
  { header: 'Tax Method Purchase', key: 'taxMethodPurchase' },
  { header: 'Subcategory Code', key: 'subCategory' },
  { header: 'Product Variants Separated by |', key: 'variants' },
  { header: 'Custom Field 1', key: 'cf1' },
  { header: 'Custom Field 2', key: 'cf2' },
  { header: 'Custom Field 3', key: 'cf3' },
  { header: 'Custom Field 4', key: 'cf4' },
  { header: 'Custom Field 5', key: 'cf5' },
  { header: 'Custom Field 6', key: 'cf6' },
  { header: 'Custom Field 7', key: 'cf7' },
  { header: 'Custom Field 8', key: 'cf8' },
  { header: 'Custom Field 9', key: 'cf9' },
  { header: 'Custom Field 10', key: 'cf10' },
  { header: 'Custom Field 11', key: 'cf11' },
  { header: 'Manufacturer', key: 'manufacturer' },
]

/**
 * A sample data row — the same dummy values the legacy
 * `sample_product_import.csv` ships, so the downloaded file is immediately
 * uploadable and demonstrates every column.
 */
export const SAMPLE_ROW: ImportRow = {
  code: 'PR-11',
  name: 'Product 11',
  category: 'C1',
  unit: 'box',
  packSize: '10',
  salesMethod: 'individual',
  packCost: '100',
  cost: '10',
  packMrp: '120',
  price: '12',
  alertQuantity: '20',
  taxName: 'No Tax',
  hsnCode: 'code',
  taxMethod: 'exclusive',
  taxMethodPurchase: 'exclusive',
  subCategory: 'SC1',
  variants: 'Red|Blue|Black|White',
  cf1: 'CF1',
  cf2: 'CF2',
  cf3: 'CF3',
  cf4: 'CF4',
  cf5: 'CF5',
  cf6: 'CF6',
  cf7: 'CF7',
  cf8: 'CF8',
  cf9: 'CF9',
  cf10: 'CF10',
  cf11: 'CF11',
  manufacturer: 'Cipla',
}

/** Quote a CSV cell only when it contains a comma, quote or newline. */
function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Build the full sample CSV text (header row + one dummy data row). */
export function buildSampleCsv(): string {
  const header = IMPORT_COLUMNS.map((c) => csvCell(c.header)).join(',')
  const data = IMPORT_COLUMNS.map((c) => csvCell(SAMPLE_ROW[c.key])).join(',')
  return `${header}\n${data}\n`
}

/* ── value coercion helpers ─────────────────────────────────────────────── */
const str = (v: string): string | undefined => (v.trim() === '' ? undefined : v.trim())
const num = (v: string): number | undefined => {
  const t = v.trim()
  if (t === '') return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

/** Map the legacy sales-method text to the backend enum (`pack_size` → PACK). */
function mapSalesMethod(v: string): 'INDIVIDUAL' | 'PACK' | undefined {
  const t = v.trim().toLowerCase()
  if (!t) return undefined
  return t === 'pack' || t === 'pack_size' || t === 'packsize' ? 'PACK' : 'INDIVIDUAL'
}

/** Map the legacy tax-method text to the backend enum (`exclusive` → EXCLUSIVE). */
function mapTaxMethod(v: string): 'INCLUSIVE' | 'EXCLUSIVE' | undefined {
  const t = v.trim().toLowerCase()
  if (!t) return undefined
  return t === 'exclusive' ? 'EXCLUSIVE' : 'INCLUSIVE'
}

/** Split the `Variants` cell (`Red|Blue|…`) into create-payload variant rows. */
function toVariants(v: string): { name: string }[] {
  return v
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }))
}

/**
 * Resolve a manufacturer name to its SiteAdmin master-manufacturer id, memoised
 * per import run. Unknown names resolve to `undefined` so the row still imports
 * (the product is simply created without a manufacturer link).
 */
const manufacturerIdCache = new Map<string, string | undefined>()
async function resolveManufacturerId(name: string): Promise<string | undefined> {
  const key = name.trim().toLowerCase()
  if (!key) return undefined
  if (manufacturerIdCache.has(key)) return manufacturerIdCache.get(key)
  let id: string | undefined
  try {
    const page = await fetchManufacturerOptionsPage({ page: 1, search: name.trim(), pageSize: 25 })
    id = page.data.find((o) => o.name.trim().toLowerCase() === key)?.id
  } catch {
    id = undefined
  }
  manufacturerIdCache.set(key, id)
  return id
}

/**
 * Convert a raw CSV row into the SiteAdmin create payload. Category/sub-category/
 * unit/tax are sent by **name** (the master-product create route stores these as
 * free text), so no reference ids are required for a CSV import.
 */
async function toPayload(row: ImportRow): Promise<Record<string, unknown>> {
  const variants = toVariants(row.variants)
  const manufacturerId = await resolveManufacturerId(row.manufacturer)
  return {
    name: row.name.trim(),
    code: str(row.code),
    category: str(row.category),
    subCategory: str(row.subCategory),
    unit: str(row.unit),
    packSize: str(row.packSize),
    salesMethod: mapSalesMethod(row.salesMethod),
    packCost: num(row.packCost),
    cost: num(row.cost),
    packMrp: num(row.packMrp),
    price: num(row.price),
    alertQuantity: num(row.alertQuantity),
    taxName: str(row.taxName),
    hsnCode: str(row.hsnCode),
    taxMethod: mapTaxMethod(row.taxMethod),
    taxMethodPurchase: mapTaxMethod(row.taxMethodPurchase),
    cf1: str(row.cf1),
    cf2: str(row.cf2),
    cf3: str(row.cf3),
    cf4: str(row.cf4),
    cf5: str(row.cf5),
    cf6: str(row.cf6),
    cf7: str(row.cf7),
    cf8: str(row.cf8),
    cf9: str(row.cf9),
    cf10: str(row.cf10),
    cf11: str(row.cf11),
    manufacturerId,
    hasVariants: variants.length > 0,
    variants,
    isImportable: true,
    isActive: true,
  }
}

/** Create one master product from a parsed CSV row. */
export async function createFromRow(row: ImportRow): Promise<void> {
  await api.post(MANAGE_BASE, await toPayload(row), {
    skipSuccessToast: true,
    skipErrorToast: true,
  })
}
