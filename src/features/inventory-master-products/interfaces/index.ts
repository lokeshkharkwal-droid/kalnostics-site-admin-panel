/** A global inventory master product (platform-level, SiteAdmin-maintained). */
export interface IMasterProduct {
  id: string
  code: string | null
  name: string
  category: string | null
  subCategory: string | null
  unit: string | null
  brand: string | null
  price: number
  cost: number
  hsnCode: string | null
  taxName: string | null
  taxRate: number | null
  description: string | null
  genericName: string | null
  strength: string | null
  isImportable: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Create/update payload (SiteAdmin). */
export interface IMasterProductForm {
  name: string
  code: string
  category: string
  subCategory: string
  unit: string
  brand: string
  price: string
  cost: string
  hsnCode: string
  taxName: string
  taxRate: string
  description: string
  genericName: string
  strength: string
  isImportable: boolean
  isActive: boolean
}

export interface IMasterProductListParams {
  page: number
  limit: number
  search?: string
}

export interface IMasterProductListResult {
  rows: IMasterProduct[]
  total: number
  totalPages: number
}
