import { api } from '@/shared/services/api'
import type {
  ListTemplatesParams,
  ListTemplatesResult,
  PdfTemplateEntity,
  PdfTemplateListRow,
  PdfTemplateWriteDto,
  TemplateTypes,
} from '../interfaces'

/** SITE_ADMIN global PDF report templates (shared across every business). */
const BASE = '/api/v1/siteadmin/pdf-report-templates'

/** SiteAdmin image upload for global templates (tenant-less; images only). */
const UPLOAD_URL = '/api/v1/siteadmin/uploads/attachment'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Paginated, server-filtered template list (search matches name). */
export async function listTemplates(
  params: ListTemplatesParams,
): Promise<ListTemplatesResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.search?.trim()) query.search = params.search.trim()
  if (params.type) query.type = params.type
  if (params.status) query.status = params.status

  const res = await api.get<PdfTemplateListRow[]>(BASE, { params: query })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  const rows = res.data
  return {
    rows,
    total: meta.total ?? rows.length,
    totalPages: meta.totalPages ?? 1,
    page: meta.page ?? params.page ?? 1,
  }
}

/** Fetch one template (meta parsed into an object). */
export async function getTemplate(id: string): Promise<PdfTemplateEntity> {
  const res = await api.get<PdfTemplateEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create a global PDF report template. */
export async function createTemplate(
  dto: PdfTemplateWriteDto,
): Promise<PdfTemplateEntity> {
  const res = await api.post<PdfTemplateEntity>(BASE, dto, {
    successMessage: 'Template created',
  })
  return res.data
}

/** Update a global PDF report template. */
export async function updateTemplate(
  id: string,
  dto: Partial<PdfTemplateWriteDto>,
): Promise<PdfTemplateEntity> {
  const res = await api.patch<PdfTemplateEntity>(`${BASE}/${id}`, dto, {
    successMessage: 'Template updated',
  })
  return res.data
}

/** Soft-delete a global PDF report template. */
export async function deleteTemplate(id: string): Promise<PdfTemplateEntity> {
  const res = await api.delete<PdfTemplateEntity>(`${BASE}/${id}`, {
    successMessage: 'Template deleted',
  })
  return res.data
}

/** Supported template type keys + human labels (for the type select/filter). */
export async function fetchTemplateTypes(): Promise<TemplateTypes> {
  const res = await api.get<TemplateTypes>(`${BASE}/options/types`)
  return res.data
}

/**
 * Upload a single image for a global template to S3 and return its public URL.
 * The caller derives a token id from the URL and stores `id → url` in
 * `meta.images` (or the URL directly in `meta.watermark_image`).
 */
export async function uploadTemplateImage(file: File): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post<{ url: string }>(UPLOAD_URL, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipSuccessToast: true,
  })
  return res.data
}

/**
 * Render a template to a PDF. Sends an empty body so unresolved `{placeholders}`
 * render literally (template preview). Returns a Blob for an <embed>/download.
 * The response is an ArrayBuffer, so the envelope interceptor leaves it intact.
 */
export async function generatePreview(id: string): Promise<Blob> {
  const res = await api.post<ArrayBuffer>(
    `${BASE}/${id}/generate`,
    {},
    { responseType: 'arraybuffer', skipSuccessToast: true },
  )
  return new Blob([res.data], { type: 'application/pdf' })
}
