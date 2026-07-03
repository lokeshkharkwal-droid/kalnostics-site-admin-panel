import type { TestGroup } from '../interfaces'

/** A blank test group for the create form. */
export function emptyTestGroup(): TestGroup {
  return {
    id: '',
    groupName: '',
    labTests: [],
  }
}
