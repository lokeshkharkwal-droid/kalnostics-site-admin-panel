import type { Category } from '../interfaces'

/** A blank category for the create form (defaults to INDEPENDENT). */
export function emptyCategory(): Category {
  return {
    id: '',
    name: '',
    shortName: '',
    description: '',
    code: '',
    isActive: true,
    moduleMapping: [],
    categoryType: 'INDEPENDENT',
    department: null,
  }
}
