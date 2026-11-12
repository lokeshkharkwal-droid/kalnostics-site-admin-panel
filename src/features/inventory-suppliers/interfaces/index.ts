/** A global inventory supplier (platform-level, SiteAdmin-maintained). */
export interface ISupplier {
  id: string
  company: string | null
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  vatNo: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Create/update payload (SiteAdmin). */
export interface ISupplierForm {
  company: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  vatNo: string
  isActive: boolean
}

export interface ISupplierListParams {
  page: number
  limit: number
  search?: string
}

export interface ISupplierListResult {
  rows: ISupplier[]
  total: number
  totalPages: number
}
