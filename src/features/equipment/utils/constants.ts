import type { Equipment } from '../interfaces'

/** A blank equipment for the create form. */
export function emptyEquipment(): Equipment {
  return {
    id: '',
    name: '',
    code: '',
    description: '',
    setupDocument: '',
    labConfigDocument: '',
    adopterDocument: '',
    labTests: [],
  }
}
