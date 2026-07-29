import { api } from '@/shared/services/api'
import type {
  ListTemplatesParams,
  ListTemplatesResult,
  MessagingTemplate,
  MessagingTemplateWriteDto,
} from '../interfaces'

/** SITE_ADMIN global messaging/notification templates (shared across every business). */
const BASE = '/api/v1/siteadmin/templates'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Paginated, server-filtered template list (search matches display title). */
export async function listTemplates(params: ListTemplatesParams): Promise<ListTemplatesResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.preference) query.preference = params.preference
  if (params.feature) query.feature = params.feature
  if (params.messageType) query.messageType = params.messageType
  if (params.level) query.level = params.level
  if (params.applicableBranchType) query.applicableBranchType = params.applicableBranchType
  if (params.isActive) query.isActive = params.isActive
  if (params.isEnabled) query.isEnabled = params.isEnabled
  if (params.isDefault) query.isDefault = params.isDefault

  const res = await api.get<MessagingTemplate[]>(BASE, { params: query })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  const rows = res.data
  return {
    rows,
    total: meta.total ?? rows.length,
    totalPages: meta.totalPages ?? 1,
    page: meta.page ?? params.page ?? 1,
  }
}

/** Fetch one global template. */
export async function getTemplate(id: string): Promise<MessagingTemplate> {
  const res = await api.get<MessagingTemplate>(`${BASE}/${id}`)
  return res.data
}

/** Create a global messaging template. */
export async function createTemplate(dto: MessagingTemplateWriteDto): Promise<MessagingTemplate> {
  const res = await api.post<MessagingTemplate>(BASE, dto, {
    successMessage: 'Template created',
  })
  return res.data
}

/** Update a global messaging template. */
export async function updateTemplate(
  id: string,
  dto: Partial<MessagingTemplateWriteDto>,
): Promise<MessagingTemplate> {
  const res = await api.patch<MessagingTemplate>(`${BASE}/${id}`, dto, {
    successMessage: 'Template updated',
  })
  return res.data
}

/** Soft-delete a global messaging template. */
export async function deleteTemplate(id: string): Promise<MessagingTemplate> {
  const res = await api.delete<MessagingTemplate>(`${BASE}/${id}`, {
    successMessage: 'Template deleted',
  })
  return res.data
}

/** Duplicate a global messaging template (deep copy with " (Copy)" name). */
export async function duplicateTemplate(id: string): Promise<MessagingTemplate> {
  const res = await api.post<MessagingTemplate>(
    `${BASE}/${id}/duplicate`,
    {},
    { successMessage: 'Template duplicated' },
  )
  return res.data
}
