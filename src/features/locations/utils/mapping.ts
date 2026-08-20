import type {
  AreaEntity,
  AreaWriteDto,
  CityEntity,
  CityWriteDto,
  CountryEntity,
  CountryWriteDto,
  StateEntity,
  StateWriteDto,
} from '@/entities/location'
import type { Area, City, Country, State } from '../interfaces'

/** Resolve a parent id to a display label via a name map (falls back to the id). */
type Resolve = (id: string) => string

/**
 * Normalise a location name to Title Case before persisting.
 * Trims surrounding whitespace, collapses inner runs of whitespace, and
 * capitalises the first letter of each word regardless of how it was typed
 * (`uttar pradesh` / `NEW DELHI` → `Uttar Pradesh` / `New Delhi`).
 */
function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\p{L}/gu, (ch) => ch.toUpperCase())
}

/* ── Country ── */

export function countryFromEntity(e: CountryEntity): Country {
  return { id: e.id, name: e.name, code: e.code, isActive: e.isActive }
}

export function countryToWriteDto(c: Country): CountryWriteDto {
  return { name: toTitleCase(c.name), code: c.code.trim(), isActive: c.isActive }
}

export function validateCountry(c: Country): string | null {
  if (c.name.trim().length < 2) return 'Country name must be at least 2 characters'
  if (!c.code.trim()) return 'Country code is required'
  return null
}

/* ── State ── */

export function stateFromEntity(e: StateEntity, countryName: Resolve): State {
  return {
    id: e.id,
    name: e.name,
    code: e.code,
    isActive: e.isActive,
    country: { id: e.countryId, label: countryName(e.countryId) },
  }
}

export function stateToWriteDto(s: State): StateWriteDto {
  return {
    name: toTitleCase(s.name),
    code: s.code.trim(),
    countryId: s.country?.id ?? '',
    isActive: s.isActive,
  }
}

export function validateState(s: State): string | null {
  if (s.name.trim().length < 2) return 'State name must be at least 2 characters'
  if (!s.code.trim()) return 'State code is required'
  if (!s.country) return 'Select a country'
  return null
}

/* ── City ── */

export function cityFromEntity(e: CityEntity, countryName: Resolve, stateName: Resolve): City {
  return {
    id: e.id,
    name: e.name,
    pinCode: e.pinCode,
    isActive: e.isActive,
    country: { id: e.countryId, label: countryName(e.countryId) },
    state: { id: e.stateId, label: stateName(e.stateId) },
  }
}

export function cityToWriteDto(c: City): CityWriteDto {
  return {
    name: toTitleCase(c.name),
    pinCode: c.pinCode.trim(),
    stateId: c.state?.id ?? '',
    countryId: c.country?.id ?? '',
    isActive: c.isActive,
  }
}

export function validateCity(c: City): string | null {
  if (!c.country) return 'Select a country'
  if (!c.state) return 'Select a state'
  if (c.name.trim().length < 2) return 'City name must be at least 2 characters'
  if (!/^\d{6}$/.test(c.pinCode.trim())) return 'PIN code must be exactly 6 digits'
  return null
}

/* ── Area ── */

export function areaFromEntity(
  e: AreaEntity,
  countryName: Resolve,
  stateName: Resolve,
  cityName: Resolve,
): Area {
  return {
    id: e.id,
    name: e.name,
    locality: e.locality,
    isActive: e.isActive,
    country: { id: e.countryId, label: countryName(e.countryId) },
    state: { id: e.stateId, label: stateName(e.stateId) },
    city: { id: e.cityId, label: cityName(e.cityId) },
  }
}

export function areaToWriteDto(a: Area): AreaWriteDto {
  return {
    name: toTitleCase(a.name),
    locality: a.locality.trim(),
    cityId: a.city?.id ?? '',
    stateId: a.state?.id ?? '',
    countryId: a.country?.id ?? '',
    isActive: a.isActive,
  }
}

export function validateArea(a: Area): string | null {
  if (!a.country) return 'Select a country'
  if (!a.state) return 'Select a state'
  if (!a.city) return 'Select a city'
  if (a.name.trim().length < 2) return 'Area name must be at least 2 characters'
  if (a.locality.trim().length < 2) return 'Locality name must be at least 2 characters'
  return null
}
