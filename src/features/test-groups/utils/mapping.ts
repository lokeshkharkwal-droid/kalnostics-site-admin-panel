import type { TestGroupEntity, TestGroupWriteDto } from '@/entities/test-group'
import type { TestGroup } from '../interfaces'

/** Backend entity → rich UI model (for edit/view). Lab tests → select options. */
export function fromEntity(e: TestGroupEntity): TestGroup {
  return {
    id: e.id,
    groupName: e.groupName,
    labTests: (e.labTests ?? []).map((t) => ({ id: t.id, label: t.testName })),
  }
}

/** UI model → create/update payload (selected options → lab-test ids). */
export function toWriteDto(g: TestGroup): TestGroupWriteDto {
  return {
    groupName: g.groupName.trim(),
    labTestIds: g.labTests.map((o) => o.id),
  }
}

/**
 * Client-side validation shared by the create/edit form. Returns an error
 * message, or null when valid.
 */
export function validateTestGroup(g: TestGroup): string | null {
  if (g.groupName.trim().length < 2) return 'Group Name must be at least 2 characters'
  if (g.labTests.length === 0) return 'Select at least one lab test'
  return null
}
