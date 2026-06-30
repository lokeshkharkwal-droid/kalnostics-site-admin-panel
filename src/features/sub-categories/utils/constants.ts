import type { SubCategory } from '../interfaces'

/** A blank sub-category for the create form (defaults to INDEPENDENT). */
export function emptySubCategory(): SubCategory {
  return {
    id: '',
    name: '',
    shortName: '',
    description: '',
    code: '',
    isActive: true,
    moduleMapping: [],
    subCategoryType: 'INDEPENDENT',
    department: null,
    category: null,
  }
}
