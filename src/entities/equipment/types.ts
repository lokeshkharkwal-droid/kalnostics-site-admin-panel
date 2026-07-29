/* ═══════════════════════════════════════════════════════════════════════
   Backend-facing Equipment contract (mirrors kalnostics-new Equipment model +
   SiteAdmin DTOs). Equipment are platform-level, SiteAdmin-only global lab-
   equipment catalogue entries that reference SITE_ADMIN lab-test templates. The
   get-one / create / update response embeds the mapped lab tests; the listing
   row carries just the count.
   ═══════════════════════════════════════════════════════════════════════ */

/** A mapped SITE_ADMIN lab test, as embedded in an equipment detail response. */
export interface EquipmentLabTest {
  id: string
  testName: string
  testCode: string
}

/** Full equipment with its mapped lab tests (create / update / get-by-id shape). */
export interface EquipmentEntity {
  id: string
  name: string
  code: string | null
  description: string | null
  setupDocument: string | null
  labConfigDocument: string | null
  adopterDocument: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  labTests: EquipmentLabTest[]
}

/** List projection — id, name, code, and the count of mapped lab tests. */
export interface EquipmentListRow {
  id: string
  name: string
  code: string | null
  labTestsCount: number
}

/** Create/update payload — identity + documents plus the selected lab-test ids. */
export interface EquipmentWriteDto {
  name: string
  code?: string
  description?: string
  setupDocument?: string
  labConfigDocument?: string
  adopterDocument?: string
  labTestIds: string[]
}
