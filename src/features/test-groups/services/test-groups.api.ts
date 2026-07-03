import { api } from '@/shared/services/api'
import type { PageResult } from '@/shared/ui'
import type { TestGroupEntity, TestGroupListRow, TestGroupWriteDto } from '@/entities/test-group'
import type { ListTestGroupsParams, ListTestGroupsResult } from '../interfaces'

/**
 * SITE_ADMIN test groups — platform-level named bundles of SITE_ADMIN lab-test
 * templates. The `/api/v1/siteadmin` prefix tells the api interceptor to attach
 * the `siteadmin_token`.
 */
const BASE = '/api/v1/siteadmin/test-groups'

/** SITE_ADMIN lab-test template options endpoint (feeds the Lab Tests select). */
const LAB_TEST_OPTIONS = '/api/v1/siteadmin/lab-tests/options'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Paginated, server-filtered test-group list (search matches groupName). */
export async function listTestGroups(params: ListTestGroupsParams): Promise<ListTestGroupsResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.search?.trim()) query.search = params.search.trim()

  const res = await api.get<TestGroupListRow[]>(BASE, { params: query })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  const rows = res.data
  return {
    rows,
    total: meta.total ?? rows.length,
    totalPages: meta.totalPages ?? 1,
    page: meta.page ?? params.page ?? 1,
  }
}

/** Fetch one test group with its mapped lab tests. */
export async function getTestGroup(id: string): Promise<TestGroupEntity> {
  const res = await api.get<TestGroupEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create a test group with its selected lab tests. */
export async function createTestGroup(dto: TestGroupWriteDto): Promise<TestGroupEntity> {
  const res = await api.post<TestGroupEntity>(BASE, dto, { successMessage: 'Test group created' })
  return res.data
}

/** Update a test group (mapped lab tests replaced when `labTestIds` is sent). */
export async function updateTestGroup(id: string, dto: Partial<TestGroupWriteDto>): Promise<TestGroupEntity> {
  const res = await api.patch<TestGroupEntity>(`${BASE}/${id}`, dto, { successMessage: 'Test group updated' })
  return res.data
}

/** Soft-delete a test group (its mappings are cascade soft-deleted). */
export async function deleteTestGroup(id: string): Promise<TestGroupEntity> {
  const res = await api.delete<TestGroupEntity>(`${BASE}/${id}`, { successMessage: 'Test group deleted' })
  return res.data
}

/**
 * Page fetcher for `PaginatedSelect` — the Lab Tests multi-select in the Test
 * Group form. Loads active SITE_ADMIN lab-test templates as `{ id, name }`
 * options with search + Load More.
 */
export async function fetchLabTestOptionsPage(
  { page, search, pageSize }: { page: number; search: string; pageSize: number },
): Promise<PageResult> {
  const query: Record<string, string | number> = { page, limit: pageSize }
  if (search.trim()) query.search = search.trim()
  const res = await api.get<{ id: string; name: string }[]>(LAB_TEST_OPTIONS, { params: query, skipSuccessToast: true })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  return {
    data: res.data.map((t) => ({ id: t.id, name: t.name })),
    meta: { page: meta.page ?? page, totalPages: meta.totalPages ?? 1 },
  }
}
