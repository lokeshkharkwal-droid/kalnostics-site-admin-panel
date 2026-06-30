import type { DepartmentEntity, DepartmentWriteDto } from '@/entities/department'
import type { Department } from '../interfaces'

/** Backend entity → rich UI model (for edit/view). */
export function fromEntity(e: DepartmentEntity): Department {
  return {
    id: e.id,
    name: e.name,
    shortName: e.shortName,
    description: e.description ?? '',
    code: e.code,
    isActive: e.isActive,
    moduleMapping: e.moduleMapping ?? [],
  }
}

/** UI model → create/update payload (`code` is never sent). */
export function toWriteDto(d: Department): DepartmentWriteDto {
  const dto: DepartmentWriteDto = {
    name: d.name.trim(),
    shortName: d.shortName.trim().toUpperCase(),
    isActive: d.isActive,
    moduleMapping: d.moduleMapping,
  }
  const desc = d.description.trim()
  if (desc) dto.description = desc
  return dto
}

/**
 * Client-side validation shared by the create/edit form. Returns an error
 * message, or null when valid.
 */
export function validateDepartment(d: Department): string | null {
  if (d.name.trim().length < 2) return 'Name must be at least 2 characters'
  if (!/^[A-Z0-9]{2,6}$/.test(d.shortName.trim().toUpperCase()))
    return 'Short Name must be 2–6 uppercase letters or digits (A–Z, 0–9)'
  if (!d.description.trim()) return 'Description is required'
  if (d.moduleMapping.length === 0) return 'Select at least one module'
  return null
}
