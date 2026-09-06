/**
 * PDF report template types (SiteAdmin global templates). Mirrors the backend
 * contract at `/api/v1/siteadmin/pdf-report-templates`. `meta` is a real JSON
 * object on the wire (NOT a stringified blob) — every value is a string.
 */

/** Page + section settings persisted in the template's `meta` JSON. */
export interface TemplateMeta {
  // General tab
  orientation: string // 'P' | 'L'
  page_size: string // 'A4' | 'A5' | 'A3' | 'Letter' | 'Legal'
  default_font_size: string
  default_font: string
  margin_left: string
  margin_right: string
  margin_top: string
  margin_bottom: string
  margin_header: string
  margin_footer: string
  watermark_text: string
  /** Uploaded watermark image URL; applied automatically (wins over watermark_text). */
  watermark_image: string
  template_version: string
  custom_css: string
  // Header tab
  header_name: string
  header_html: string
  // Body tab
  body_name: string
  body_html: string
  associate_body_image: string
  // Footer tab
  footer_name: string
  footer_html: string
  /** Uploaded-image registry: `{{image:<id>}}` token id → resolved URL. */
  images: Record<string, string>
}

/** Full template as returned by GET `/:id` (meta parsed into an object). */
export interface PdfTemplateEntity {
  id: string
  type: string
  name: string
  isActive: boolean
  meta: Partial<TemplateMeta> | null
  createdAt: string
  updatedAt: string | null
}

/** Row shape for the list grid. */
export interface PdfTemplateListRow {
  id: string
  type: string
  name: string
  isActive: boolean
  createdAt: string
}

/** POST / PATCH body. `meta` is sent as an object. */
export interface PdfTemplateWriteDto {
  type: string
  name: string
  isActive: boolean
  meta: TemplateMeta
}

/** Editable form model held by the editor. */
export interface PdfTemplateForm {
  type: string
  name: string
  isActive: boolean
  meta: TemplateMeta
}

export type StatusFilter = '' | 'ACTIVE' | 'INACTIVE'

export type EditorTab = 'general' | 'header' | 'body' | 'footer'

export interface ListTemplatesParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  status?: StatusFilter
}

export interface ListTemplatesResult {
  rows: PdfTemplateListRow[]
  total: number
  totalPages: number
  page: number
}

/** Response of GET `/options/types`. */
export interface TemplateTypes {
  types: string[]
  labels: Record<string, string>
}
