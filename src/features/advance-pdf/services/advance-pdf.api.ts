import { api } from '@/shared/services/api'
import type { AdvanceContextType, AdvanceDocument } from '@/lib/pdf-v2-types'
import { defaultAdvanceDocument } from '../utils/default-document'

/**
 * API client for the SiteAdmin Advance PDF templates, wired to the existing
 * backend at `/api/v1/siteadmin/pdf-report-templates`. The block document is
 * stored in the template's `doc` JSON column; live preview + PDF come from the
 * block-renderer endpoints (`/:id/preview-html`, `/:id/render`).
 *
 * The backend entity uses `id: string` (UUID) + `isActive: boolean` +
 * `createdAt/updatedAt`; this module adapts those to the shape the ported
 * editor/listing expect (`status` 1/0, `scope`, `created_on/updated_on`).
 */
const BASE = '/api/v1/siteadmin/pdf-report-templates'

/** Human labels for the type select (mirrors PDF_REPORT_TEMPLATE_TYPE_LABELS). */
export const TEMPLATE_TYPES: Record<string, string> = {
  lab_report: 'Lab Report',
  radiology_report: 'Radiology Report',
  invoice: 'Invoice / Receipt',
  prescription: 'Prescription',
  appointment_slip: 'Appointment Slip',
  registration_slip: 'Registration Slip',
}

/** Map a stored template `type` onto the renderer's narrower context type. */
export function toContextType(type: string): AdvanceContextType {
  if (type === 'invoice') return 'order_invoice'
  return 'lab_report'
}

/** Row shape consumed by the listing table. */
export interface AdvanceTemplateRow {
  id: string
  type: string
  name: string
  status: number
  scope: 'system' | 'business'
  entity_id: number | null
  created_on: string
  updated_on: string | null
}

/**
 * Full template consumed by the editor. `type` is the real backend key (so
 * duplicate/save round-trip it faithfully); use `toContextType(tpl.type)` for
 * the renderer/validator's narrower context type.
 */
export interface AdvanceTemplateFull {
  id: string
  type: string
  name: string
  status: number
  scope: 'system' | 'business'
  doc: AdvanceDocument
}

/** Raw backend entity (the fields we use). */
interface BackendEntity {
  id: string
  type: string
  name: string
  isActive: boolean
  doc: AdvanceDocument | null
  createdAt: string
  updatedAt: string | null
}

function toRow(e: BackendEntity): AdvanceTemplateRow {
  return {
    id: e.id,
    type: e.type,
    name: e.name,
    status: e.isActive ? 1 : 0,
    scope: 'system',
    entity_id: null,
    created_on: e.createdAt,
    updated_on: e.updatedAt,
  }
}

/** List SiteAdmin global advance templates. */
export async function listTemplates(): Promise<AdvanceTemplateRow[]> {
  const res = await api.get<BackendEntity[]>(BASE, { params: { limit: 100 } })
  return (res.data ?? []).map(toRow)
}

/** Fetch a single template (with its block document) for the editor. */
export async function getTemplate(id: string): Promise<AdvanceTemplateFull> {
  const res = await api.get<BackendEntity>(`${BASE}/${id}`)
  const e = res.data
  return {
    id: e.id,
    type: e.type,
    name: e.name,
    status: e.isActive ? 1 : 0,
    scope: 'system',
    doc: e.doc ?? defaultAdvanceDocument(),
  }
}

/** Create a template seeded with a default document; returns the new id. */
export async function createTemplate(name: string, type: string): Promise<string> {
  const res = await api.post<BackendEntity>(
    BASE,
    { name, type, isActive: true, doc: defaultAdvanceDocument() },
    { successMessage: 'Template created' },
  )
  return res.data.id
}

/** Persist the block document (silent — the editor auto-saves). */
export async function saveDoc(id: string, doc: AdvanceDocument): Promise<void> {
  await api.patch(`${BASE}/${id}`, { doc }, { skipSuccessToast: true })
}

/** Persist the template name. */
export async function saveName(id: string, name: string): Promise<void> {
  await api.patch(`${BASE}/${id}`, { name }, { skipSuccessToast: true })
}

/** Update a template's name and type (from the listing Edit form). */
export async function updateTemplate(id: string, name: string, type: string): Promise<void> {
  await api.patch(`${BASE}/${id}`, { name, type }, { successMessage: 'Template updated' })
}

/** Mark the template active (`isActive: true`). */
export async function activateTemplate(id: string): Promise<void> {
  await api.patch(`${BASE}/${id}`, { isActive: true }, { skipSuccessToast: true })
}

/** Soft-delete a template. */
export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`, { skipSuccessToast: true })
}

/**
 * Duplicate a template. The backend has no clone endpoint, so we read the
 * source and create a copy client-side; returns the new id.
 */
export async function duplicateTemplate(id: string): Promise<string> {
  const src = await getTemplate(id)
  const res = await api.post<BackendEntity>(
    BASE,
    { name: `${src.name} (Copy)`, type: src.type, isActive: true, doc: src.doc },
    { skipSuccessToast: true },
  )
  return res.data.id
}

/** Fetch the server-rendered preview HTML (sample data) for the editor iframe. */
export async function fetchPreviewHtml(id: string): Promise<string> {
  const res = await api.get<string>(`${BASE}/${id}/preview-html`, {
    responseType: 'text',
    transformResponse: [(d) => d],
    skipSuccessToast: true,
  })
  return String(res.data ?? '')
}

/** Render the template's block document to a PDF blob (sample data). */
export async function renderPdf(id: string): Promise<Blob> {
  const res = await api.post<Blob>(
    `${BASE}/${id}/render`,
    {},
    { responseType: 'blob', skipSuccessToast: true },
  )
  return res.data
}

/**
 * "Upload" an image. The backend has no upload endpoint, so we embed the file
 * as a base64 data URI — it persists inside the document JSON and renders in
 * both the preview and the Puppeteer PDF. (A real upload endpoint can replace
 * this later without touching call sites.)
 */
export function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read the image file'))
    reader.readAsDataURL(file)
  })
}
