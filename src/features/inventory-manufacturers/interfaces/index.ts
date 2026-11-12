/** A global inventory manufacturer (platform-level, SiteAdmin-maintained). */
export interface IManufacturer {
  id: string
  logoUrl: string | null
  company: string
  name: string
  vatNo: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  invoiceFooter: string | null
  cf1: string | null
  cf2: string | null
  cf3: string | null
  cf4: string | null
  cf5: string | null
  cf6: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Create/update payload (SiteAdmin). */
export interface IManufacturerForm {
  logoUrl: string
  company: string
  name: string
  vatNo: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  invoiceFooter: string
  cf1: string
  cf2: string
  cf3: string
  cf4: string
  cf5: string
  cf6: string
  isActive: boolean
}

export interface IManufacturerListParams {
  page: number
  limit: number
  search?: string
}

export interface IManufacturerListResult {
  rows: IManufacturer[]
  total: number
  totalPages: number
}
