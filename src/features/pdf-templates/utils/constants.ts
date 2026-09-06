import type { PdfTemplateForm, TemplateMeta } from '../interfaces'

/**
 * Defaults for a template's `meta`. New templates start here; loaded templates
 * merge their stored `meta` over these so every key is always present.
 */
export const DEFAULT_META: TemplateMeta = {
  orientation: 'P',
  page_size: 'A4',
  default_font_size: '10',
  default_font: '',
  margin_left: '15',
  margin_right: '10',
  margin_top: '10',
  margin_bottom: '10',
  margin_header: '5',
  margin_footer: '5',
  watermark_text: '',
  watermark_image: '',
  template_version: '',
  custom_css: '',
  header_name: '',
  header_html: '',
  body_name: '',
  body_html: '',
  associate_body_image: '',
  footer_name: '',
  footer_html: '',
  images: {},
}

/** A blank template for the create form (default type `lab_report`, active). */
export function emptyTemplateForm(): PdfTemplateForm {
  return {
    type: 'lab_report',
    name: '',
    isActive: true,
    meta: { ...DEFAULT_META },
  }
}

/** Merge a (possibly partial) stored meta over the defaults. */
export function mergeMeta(stored: Partial<TemplateMeta> | null | undefined): TemplateMeta {
  return { ...DEFAULT_META, ...(stored ?? {}) }
}

export const ORIENTATION_OPTIONS = [
  { value: 'P', label: 'Portrait' },
  { value: 'L', label: 'Landscape' },
]

export const PAGE_SIZE_OPTIONS = ['A4', 'A5', 'A3', 'Letter', 'Legal'].map((v) => ({
  value: v,
  label: v,
}))

export const FONT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'courier', label: 'Courier' },
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'times', label: 'Times' },
  { value: 'dejavusans', label: 'DejaVu Sans' },
  { value: 'dejavuserif', label: 'DejaVu Serif' },
  { value: 'timesb', label: 'Times Bold' },
  { value: 'helveticab', label: 'Helvetica Bold' },
]

export const STATUS_SELECT_OPTIONS = [
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]
