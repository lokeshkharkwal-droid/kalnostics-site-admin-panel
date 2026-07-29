import type { SupportInfo, SupportInfoEntity, SupportInfoWriteDto } from '../interfaces'

/**
 * Parse the stored `helpContent` string into HTML for the editor. TinyMCE is
 * HTML-native, so this is normally a pass-through. Records authored under the
 * old Editor.js editor were stored as a stringified `{ html, blocks }`; those
 * are unwrapped to their `html` so they still open losslessly.
 */
export function parseHelpContent(raw: string | null | undefined): string {
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'html' in parsed) {
      return String(parsed.html ?? '')
    }
  } catch {
    /* not JSON — treat as raw HTML below */
  }
  return raw
}

/** Backend entity → rich UI model (for edit/view). */
export function fromEntity(e: SupportInfoEntity): SupportInfo {
  return {
    id: e.id,
    metaType: e.metaType,
    code: e.code ?? '',
    title: e.title,
    tenantType: e.tenantType,
    status: e.status,
    requestUrl: e.requestUrl ?? '',
    help: parseHelpContent(e.helpContent),
  }
}

/** UI model → create/update payload. */
export function toWriteDto(d: SupportInfo): SupportInfoWriteDto {
  const dto: SupportInfoWriteDto = {
    metaType: d.metaType.trim(),
    title: d.title.trim(),
    tenantType: d.tenantType,
    status: d.status,
    helpContent: d.help,
  }
  const code = d.code.trim()
  if (code) dto.code = code
  const url = d.requestUrl.trim()
  if (url) dto.requestUrl = url
  return dto
}

/** Does the help content have anything meaningful in it? */
export function isHelpEmpty(help: string): boolean {
  return help.replace(/<[^>]*>/g, '').trim().length === 0
}

/** Client-side validation shared by the create/edit form. Returns an error, or null. */
export function validateSupportInfo(d: SupportInfo): string | null {
  if (d.metaType.trim().length < 1) return 'Meta Type is required'
  if (d.title.trim().length < 1) return 'Title is required'
  if (d.tenantType !== 'BUSINESS' && d.tenantType !== 'BRANCH') return 'Tenant Type is required'
  if (d.requestUrl.trim() && !/^https?:\/\/|^\//i.test(d.requestUrl.trim()))
    return 'Request URL must be an absolute URL or a path starting with "/"'
  if (isHelpEmpty(d.help)) return 'Help content is required'
  return null
}
