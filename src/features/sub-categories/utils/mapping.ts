import type { SubCategoryEntity, SubCategoryWriteDto } from '@/entities/sub-category'
import type { SubCategory } from '../interfaces'

/**
 * Backend entity → rich UI model. `resolveDeptName` / `resolveCatName` turn the
 * parent ids into display labels (the list endpoint returns only ids).
 */
export function fromEntity(
  e: SubCategoryEntity,
  resolveDeptName: (id: string) => string,
  resolveCatName: (id: string) => string,
): SubCategory {
  return {
    id: e.id,
    name: e.name,
    shortName: e.shortName,
    description: e.description ?? '',
    code: e.code,
    isActive: e.isActive,
    moduleMapping: e.moduleMapping ?? [],
    subCategoryType: e.subCategoryType,
    department: e.departmentId ? { id: e.departmentId, label: resolveDeptName(e.departmentId) } : null,
    category: e.categoryId ? { id: e.categoryId, label: resolveCatName(e.categoryId) } : null,
  }
}

/** UI model → create/update payload. Only the parent matching the type is sent. */
export function toWriteDto(s: SubCategory): SubCategoryWriteDto {
  const dto: SubCategoryWriteDto = {
    name: s.name.trim(),
    shortName: s.shortName.trim().toUpperCase(),
    isActive: s.isActive,
    subCategoryType: s.subCategoryType,
    moduleMapping: s.moduleMapping,
  }
  const desc = s.description.trim()
  if (desc) dto.description = desc
  if (s.subCategoryType === 'UNDER_DEPARTMENT' && s.department) dto.departmentId = s.department.id
  if (s.subCategoryType === 'UNDER_CATEGORY' && s.category) dto.categoryId = s.category.id
  return dto
}

/** Client-side validation. Returns an error message, or null when valid. */
export function validateSubCategory(s: SubCategory): string | null {
  if (s.name.trim().length < 2) return 'Name must be at least 2 characters'
  if (!/^[A-Z0-9]{2,6}$/.test(s.shortName.trim().toUpperCase()))
    return 'Short Name must be 2–6 uppercase letters or digits (A–Z, 0–9)'
  if (!s.description.trim()) return 'Description is required'
  if (s.moduleMapping.length === 0) return 'Select at least one module'
  if (s.subCategoryType === 'UNDER_DEPARTMENT' && !s.department) return 'Select a parent department'
  if (s.subCategoryType === 'UNDER_CATEGORY' && !s.category) return 'Select a parent category'
  return null
}
