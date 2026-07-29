import type { EquipmentEntity, EquipmentWriteDto } from '@/entities/equipment'
import type { Equipment } from '../interfaces'

/** Slugify a name into an adapter code, e.g. "Sysmex XN-1000" → "sysmex-xn-1000". */
export function slugifyCode(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Backend entity → rich UI model (for edit/view). Lab tests → select options. */
export function fromEntity(e: EquipmentEntity): Equipment {
  return {
    id: e.id,
    name: e.name,
    code: e.code ?? '',
    description: e.description ?? '',
    setupDocument: e.setupDocument ?? '',
    labConfigDocument: e.labConfigDocument ?? '',
    adopterDocument: e.adopterDocument ?? '',
    labTests: (e.labTests ?? []).map((t) => ({ id: t.id, label: t.testName })),
  }
}

/** UI model → create/update payload (selected options → lab-test ids). */
export function toWriteDto(e: Equipment): EquipmentWriteDto {
  const name = e.name.trim()
  const dto: EquipmentWriteDto = {
    name,
    labTestIds: e.labTests.map((o) => o.id),
  }
  // Fall back to a slug of the name when no code was entered (legacy behaviour).
  const code = e.code.trim() || slugifyCode(name)
  if (code) dto.code = code

  const description = e.description.trim()
  if (description) dto.description = description
  if (e.setupDocument.trim()) dto.setupDocument = e.setupDocument
  if (e.labConfigDocument.trim()) dto.labConfigDocument = e.labConfigDocument
  if (e.adopterDocument.trim()) dto.adopterDocument = e.adopterDocument
  return dto
}

/**
 * Client-side validation shared by the create/edit form. Returns an error
 * message, or null when valid.
 */
export function validateEquipment(e: Equipment): string | null {
  if (e.name.trim().length < 2) return 'Name must be at least 2 characters'
  if (e.labTests.length === 0) return 'Select at least one lab test'
  return null
}
