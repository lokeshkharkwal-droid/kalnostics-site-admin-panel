import type { Area, City, Country, State } from '../interfaces'

/** Blank models for the create forms. */

export function emptyCountry(): Country {
  return { id: '', name: '', code: '', isActive: true }
}

export function emptyState(): State {
  return { id: '', name: '', code: '', isActive: true, country: null }
}

export function emptyCity(): City {
  return { id: '', name: '', pinCode: '', isActive: true, country: null, state: null }
}

export function emptyArea(): Area {
  return { id: '', name: '', locality: '', isActive: true, country: null, state: null, city: null }
}
