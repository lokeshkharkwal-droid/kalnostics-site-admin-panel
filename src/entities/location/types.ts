/* ═══════════════════════════════════════════════════════════════════════
   Backend-facing Location contract (mirrors kalnostics-new Country / State /
   City / Area models). Location data is platform-level global reference data
   (no tenant), managed by Site Admin. Hierarchy: Country → State → City → Area.
   Denormalized ancestor ids on City (stateId + countryId) and Area (cityId +
   stateId + countryId) are kept mutually consistent by the backend.
   ═══════════════════════════════════════════════════════════════════════ */

export interface CountryEntity {
  id: string
  name: string
  code: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface StateEntity {
  id: string
  name: string
  code: string
  countryId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CityEntity {
  id: string
  name: string
  pinCode: string
  stateId: string
  countryId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface AreaEntity {
  id: string
  name: string
  locality: string
  cityId: string
  stateId: string
  countryId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type CountryListRow = CountryEntity
export type StateListRow = StateEntity
export type CityListRow = CityEntity
export type AreaListRow = AreaEntity

/** Create/update payloads (no `id`/timestamps). */
export interface CountryWriteDto {
  name: string
  code: string
  isActive?: boolean
}

export interface StateWriteDto {
  name: string
  code: string
  countryId: string
  isActive?: boolean
}

export interface CityWriteDto {
  name: string
  pinCode: string
  stateId: string
  countryId: string
  isActive?: boolean
}

export interface AreaWriteDto {
  name: string
  locality: string
  cityId: string
  stateId: string
  countryId: string
  isActive?: boolean
}
