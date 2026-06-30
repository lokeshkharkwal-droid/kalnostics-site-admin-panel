import type { Department } from '../interfaces'

/** A blank department for the create form. */
export function emptyDepartment(): Department {
  return {
    id: '',
    name: '',
    shortName: '',
    description: '',
    code: '',
    isActive: true,
    moduleMapping: [],
  }
}
