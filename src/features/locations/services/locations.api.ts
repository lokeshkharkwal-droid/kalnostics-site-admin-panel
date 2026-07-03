import { api } from '@/shared/services/api'
import type { PageResult } from '@/shared/ui'
import type {
  AreaEntity,
  AreaListRow,
  AreaWriteDto,
  CityEntity,
  CityListRow,
  CityWriteDto,
  CountryEntity,
  CountryListRow,
  CountryWriteDto,
  StateEntity,
  StateListRow,
  StateWriteDto,
} from '@/entities/location'
import type {
  AreaListResult,
  CityListResult,
  CountryListResult,
  ListAreasParams,
  ListCitiesParams,
  ListCountriesParams,
  ListStatesParams,
  StateListResult,
} from '../interfaces'

/** Platform-level location master (Site Admin). */
const BASE = '/api/v1/siteadmin/locations'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Shared query builder — page/limit + optional search/isActive. */
function baseQuery(params: {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.isActive !== undefined) query.isActive = params.isActive
  return query
}

function toResult<T>(res: { data: T[] }, page: number) {
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  return {
    rows: res.data,
    total: meta.total ?? res.data.length,
    totalPages: meta.totalPages ?? 1,
    page: meta.page ?? page,
  }
}

/* ════════════════════════════ Countries ════════════════════════════ */

export async function listCountries(params: ListCountriesParams): Promise<CountryListResult> {
  const res = await api.get<CountryListRow[]>(`${BASE}/countries`, { params: baseQuery(params) })
  return toResult(res, params.page ?? 1)
}

export async function getCountry(id: string): Promise<CountryEntity> {
  const res = await api.get<CountryEntity>(`${BASE}/countries/${id}`)
  return res.data
}

export async function createCountry(dto: CountryWriteDto): Promise<CountryEntity> {
  const res = await api.post<CountryEntity>(`${BASE}/countries`, dto, { successMessage: 'Country created' })
  return res.data
}

export async function updateCountry(id: string, dto: Partial<CountryWriteDto>): Promise<CountryEntity> {
  const res = await api.patch<CountryEntity>(`${BASE}/countries/${id}`, dto, { successMessage: 'Country updated' })
  return res.data
}

export async function deleteCountry(id: string): Promise<CountryEntity> {
  const res = await api.delete<CountryEntity>(`${BASE}/countries/${id}`, { successMessage: 'Country deleted' })
  return res.data
}

/* ════════════════════════════ States ════════════════════════════ */

export async function listStates(params: ListStatesParams): Promise<StateListResult> {
  const query = baseQuery(params)
  if (params.countryId) query.countryId = params.countryId
  const res = await api.get<StateListRow[]>(`${BASE}/states`, { params: query })
  return toResult(res, params.page ?? 1)
}

export async function getState(id: string): Promise<StateEntity> {
  const res = await api.get<StateEntity>(`${BASE}/states/${id}`)
  return res.data
}

export async function createState(dto: StateWriteDto): Promise<StateEntity> {
  const res = await api.post<StateEntity>(`${BASE}/states`, dto, { successMessage: 'State created' })
  return res.data
}

export async function updateState(id: string, dto: Partial<StateWriteDto>): Promise<StateEntity> {
  const res = await api.patch<StateEntity>(`${BASE}/states/${id}`, dto, { successMessage: 'State updated' })
  return res.data
}

export async function deleteState(id: string): Promise<StateEntity> {
  const res = await api.delete<StateEntity>(`${BASE}/states/${id}`, { successMessage: 'State deleted' })
  return res.data
}

/* ════════════════════════════ Cities ════════════════════════════ */

export async function listCities(params: ListCitiesParams): Promise<CityListResult> {
  const query = baseQuery(params)
  if (params.countryId) query.countryId = params.countryId
  if (params.stateId) query.stateId = params.stateId
  const res = await api.get<CityListRow[]>(`${BASE}/cities`, { params: query })
  return toResult(res, params.page ?? 1)
}

export async function getCity(id: string): Promise<CityEntity> {
  const res = await api.get<CityEntity>(`${BASE}/cities/${id}`)
  return res.data
}

export async function createCity(dto: CityWriteDto): Promise<CityEntity> {
  const res = await api.post<CityEntity>(`${BASE}/cities`, dto, { successMessage: 'City created' })
  return res.data
}

export async function updateCity(id: string, dto: Partial<CityWriteDto>): Promise<CityEntity> {
  const res = await api.patch<CityEntity>(`${BASE}/cities/${id}`, dto, { successMessage: 'City updated' })
  return res.data
}

export async function deleteCity(id: string): Promise<CityEntity> {
  const res = await api.delete<CityEntity>(`${BASE}/cities/${id}`, { successMessage: 'City deleted' })
  return res.data
}

/* ════════════════════════════ Areas ════════════════════════════ */

export async function listAreas(params: ListAreasParams): Promise<AreaListResult> {
  const query = baseQuery(params)
  if (params.countryId) query.countryId = params.countryId
  if (params.stateId) query.stateId = params.stateId
  if (params.cityId) query.cityId = params.cityId
  const res = await api.get<AreaListRow[]>(`${BASE}/areas`, { params: query })
  return toResult(res, params.page ?? 1)
}

export async function getArea(id: string): Promise<AreaEntity> {
  const res = await api.get<AreaEntity>(`${BASE}/areas/${id}`)
  return res.data
}

export async function createArea(dto: AreaWriteDto): Promise<AreaEntity> {
  const res = await api.post<AreaEntity>(`${BASE}/areas`, dto, { successMessage: 'Area created' })
  return res.data
}

export async function updateArea(id: string, dto: Partial<AreaWriteDto>): Promise<AreaEntity> {
  const res = await api.patch<AreaEntity>(`${BASE}/areas/${id}`, dto, { successMessage: 'Area updated' })
  return res.data
}

export async function deleteArea(id: string): Promise<AreaEntity> {
  const res = await api.delete<AreaEntity>(`${BASE}/areas/${id}`, { successMessage: 'Area deleted' })
  return res.data
}

/* ══════════════════ PaginatedSelect option fetchers ══════════════════ */
/* Each returns the backend `{ data:{id,name}[], meta }` page shape. ACTIVE-only.
   Parent ids are captured by the caller (closure) so these double as cascading
   dropdowns; include the parent id in the PaginatedSelect `queryKey` too. */

export async function fetchCountryOptionsPage(
  { page, search, pageSize }: { page: number; search: string; pageSize: number },
): Promise<PageResult> {
  const query: Record<string, string | number | boolean> = { page, limit: pageSize, isActive: true }
  if (search.trim()) query.search = search.trim()
  const res = await api.get<CountryListRow[]>(`${BASE}/countries`, { params: query, skipSuccessToast: true })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  return {
    data: res.data.map((c) => ({ id: c.id, name: c.name })),
    meta: { page: meta.page ?? page, totalPages: meta.totalPages ?? 1 },
  }
}

export async function fetchStateOptionsPage(
  { page, search, pageSize, countryId }: { page: number; search: string; pageSize: number; countryId?: string },
): Promise<PageResult> {
  const query: Record<string, string | number | boolean> = { page, limit: pageSize, isActive: true }
  if (search.trim()) query.search = search.trim()
  if (countryId) query.countryId = countryId
  const res = await api.get<StateListRow[]>(`${BASE}/states`, { params: query, skipSuccessToast: true })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  return {
    data: res.data.map((s) => ({ id: s.id, name: s.name })),
    meta: { page: meta.page ?? page, totalPages: meta.totalPages ?? 1 },
  }
}

export async function fetchCityOptionsPage(
  { page, search, pageSize, stateId, countryId }: { page: number; search: string; pageSize: number; stateId?: string; countryId?: string },
): Promise<PageResult> {
  const query: Record<string, string | number | boolean> = { page, limit: pageSize, isActive: true }
  if (search.trim()) query.search = search.trim()
  if (stateId) query.stateId = stateId
  if (countryId) query.countryId = countryId
  const res = await api.get<CityListRow[]>(`${BASE}/cities`, { params: query, skipSuccessToast: true })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  return {
    data: res.data.map((c) => ({ id: c.id, name: c.name })),
    meta: { page: meta.page ?? page, totalPages: meta.totalPages ?? 1 },
  }
}

export async function fetchAreaOptionsPage(
  { page, search, pageSize, cityId, stateId, countryId }: { page: number; search: string; pageSize: number; cityId?: string; stateId?: string; countryId?: string },
): Promise<PageResult> {
  const query: Record<string, string | number | boolean> = { page, limit: pageSize, isActive: true }
  if (search.trim()) query.search = search.trim()
  if (cityId) query.cityId = cityId
  if (stateId) query.stateId = stateId
  if (countryId) query.countryId = countryId
  const res = await api.get<AreaListRow[]>(`${BASE}/areas`, { params: query, skipSuccessToast: true })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  return {
    data: res.data.map((a) => ({ id: a.id, name: a.locality || a.name })),
    meta: { page: meta.page ?? page, totalPages: meta.totalPages ?? 1 },
  }
}

/* ══════════════════ id → name maps (parent-name columns) ══════════════════ */
/* Page through ACTIVE + inactive rows at the backend's max page size so grids can
   resolve parent ids to display names. Capped at MAX_PAGES like the catalogue. */

const NAME_MAP_PAGE_LIMIT = 100
const NAME_MAP_MAX_PAGES = 20

async function buildNameMap(
  path: string,
  label: string,
): Promise<Record<string, string>> {
  const map: Record<string, string> = {}
  let page = 1
  let totalPages = 1
  do {
    const res = await api.get<{ id: string; name: string }[]>(`${BASE}/${path}`, {
      params: { page, limit: NAME_MAP_PAGE_LIMIT },
      skipSuccessToast: true,
    })
    const meta = (res as { meta?: ListMeta }).meta ?? {}
    totalPages = meta.totalPages ?? 1
    for (const r of res.data) map[r.id] = r.name
    page++
  } while (page <= totalPages && page <= NAME_MAP_MAX_PAGES)
  if (totalPages > NAME_MAP_MAX_PAGES) {
    // eslint-disable-next-line no-console
    console.warn(`[locations] ${label} name-map covered first ${NAME_MAP_MAX_PAGES} of ${totalPages} pages; some names may show as ids`)
  }
  return map
}

export const fetchCountryNameMap = () => buildNameMap('countries', 'country')
export const fetchStateNameMap = () => buildNameMap('states', 'state')
export const fetchCityNameMap = () => buildNameMap('cities', 'city')
