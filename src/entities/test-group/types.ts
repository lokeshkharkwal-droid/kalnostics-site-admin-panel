/* ═══════════════════════════════════════════════════════════════════════
   Backend-facing Test Group contract (mirrors kalnostics-new TestGroup model +
   SiteAdmin DTOs). Test groups are platform-level, SiteAdmin-only named bundles
   of SITE_ADMIN lab-test templates. The get-one / create / update response
   embeds the mapped lab tests; the listing row carries just the count.
   ═══════════════════════════════════════════════════════════════════════ */

/** A mapped SITE_ADMIN lab test, as embedded in a test-group detail response. */
export interface TestGroupLabTest {
  id: string
  testName: string
  testCode: string
}

/** Full test group with its mapped lab tests (create / update / get-by-id shape). */
export interface TestGroupEntity {
  id: string
  groupName: string
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  labTests: TestGroupLabTest[]
}

/** List projection — id, name, and the count of mapped lab tests. */
export interface TestGroupListRow {
  id: string
  groupName: string
  labTestsCount: number
}

/** Create/update payload — the group name plus the selected lab-test ids. */
export interface TestGroupWriteDto {
  groupName: string
  labTestIds: string[]
}
