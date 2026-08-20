import type { SelectOption } from '@/shared/ui'
import type {
  AreaListRow,
  CityListRow,
  CountryListRow,
  StateListRow,
} from '@/entities/location'

/* Rich UI models edited by the forms, mapped to/from the backend in
   ../utils/mapping.ts. Parents are carried as SelectOptions so the cascading
   PaginatedSelects render without an extra fetch (e.g. when editing a row whose
   parent ids came from the backend). */

export interface Country {
  id: string
  name: string
  code: string
  isActive: boolean
}

export interface State {
  id: string
  name: string
  code: string
  isActive: boolean
  country: SelectOption | null
}

export interface City {
  id: string
  name: string
  pinCode: string
  isActive: boolean
  country: SelectOption | null
  state: SelectOption | null
}

export interface Area {
  id: string
  name: string
  locality: string
  isActive: boolean
  country: SelectOption | null
  state: SelectOption | null
  city: SelectOption | null
}

export type StatusFilter = '' | 'ACTIVE' | 'INACTIVE'

/** Form modes shared by every location form modal. */
export type FormMode = 'create' | 'edit' | 'view'

/** Shared shape returned by every list service (rows + hoisted pagination meta). */
export interface ListResult<T> {
  rows: T[]
  total: number
  totalPages: number
  page: number
}

export type CountryListResult = ListResult<CountryListRow>
export type StateListResult = ListResult<StateListRow>
export type CityListResult = ListResult<CityListRow>
export type AreaListResult = ListResult<AreaListRow>

export interface ListCountriesParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface ListStatesParams extends ListCountriesParams {
  countryId?: string
}

export interface ListCitiesParams extends ListStatesParams {
  stateId?: string
}

export interface ListAreasParams extends ListCitiesParams {
  cityId?: string
}

/* ── India location sync ── */

/** Created-vs-existing tally for one hierarchy tier. */
export interface SyncTierResult {
  created: number
  existing: number
}

/** Result of importing the bundled India location master (country → state → city). */
export interface SyncIndiaResult {
  countries: SyncTierResult
  states: SyncTierResult
  cities: SyncTierResult
}
