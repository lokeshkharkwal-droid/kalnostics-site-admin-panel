import type { CategoryEntity, CategoryWriteDto } from '@/entities/category'
import type { Category } from '../interfaces'

/**
 * Backend entity → rich UI model. `resolveDeptName` turns the parent
 * `departmentId` into a display label (the list endpoint returns only the id).
 */
export function fromEntity(e: CategoryEntity, resolveDeptName: (id: string) => string): Category {
  return {
    id: e.id,
    name: e.name,
    shortName: e.shortName,
    description: e.description ?? '',
    code: e.code,
    isActive: e.isActive,
    moduleMapping: e.moduleMapping ?? [],
    categoryType: e.categoryType,
    department: e.departmentId ? { id: e.departmentId, label: resolveDeptName(e.departmentId) } : null,
  }
}

/** UI model → create/update payload. `departmentId` only for UNDER_DEPARTMENT. */
export function toWriteDto(c: Category): CategoryWriteDto {
  const dto: CategoryWriteDto = {
    name: c.name.trim(),
    shortName: c.shortName.trim().toUpperCase(),
    isActive: c.isActive,
    categoryType: c.categoryType,
    moduleMapping: c.moduleMapping,
  }
  const desc = c.description.trim()
  if (desc) dto.description = desc
  if (c.categoryType === 'UNDER_DEPARTMENT' && c.department) dto.departmentId = c.department.id
  return dto
}

/** Client-side validation. Returns an error message, or null when valid. */
export function validateCategory(c: Category): string | null {
  if (c.name.trim().length < 2) return 'Name must be at least 2 characters'
  if (!/^[A-Z0-9]{2,6}$/.test(c.shortName.trim().toUpperCase()))
    return 'Short Name must be 2–6 uppercase letters or digits (A–Z, 0–9)'
  if (!c.description.trim()) return 'Description is required'
  if (c.moduleMapping.length === 0) return 'Select at least one module'
  if (c.categoryType === 'UNDER_DEPARTMENT' && !c.department) return 'Select a parent department'
  return null
}
