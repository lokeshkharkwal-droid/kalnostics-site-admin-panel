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

/**
 * PDF page-size options. Imported verbatim from the legacy ezhealthtrack
 * project (mPDF `TemplateConstants::$page_size_option`): the full ISO A/B/C
 * series, the `C76` variant, and two custom barcode sizes (`CB1` = 100×25 mm,
 * `CB2` = 50×25 mm). `Letter`/`Legal` are kept from the previous set. The
 * `value` is the key the backend validates and resolves to exact millimetre
 * dimensions when rendering the PDF; the `label` is the descriptive text shown
 * in the dropdown.
 */
export const PAGE_SIZE_OPTIONS: { value: string; label: string }[] = [
  // A-series
  { value: 'A0', label: 'A0 (841x1189 mm ; 33.11x46.81 in)' },
  { value: 'A1', label: 'A1 (594x841 mm ; 23.39x33.11 in)' },
  { value: 'A2', label: 'A2 (420x594 mm ; 16.54x23.39 in)' },
  { value: 'A3', label: 'A3 (297x420 mm ; 11.69x16.54 in)' },
  { value: 'A4', label: 'A4 (210x297 mm ; 8.27x11.69 in)' },
  { value: 'A5', label: 'A5 (148x210 mm ; 5.83x8.27 in)' },
  { value: 'A6', label: 'A6 (105x148 mm ; 4.13x5.83 in)' },
  { value: 'A7', label: 'A7 (74x105 mm ; 2.91x4.13 in)' },
  { value: 'A8', label: 'A8 (52x74 mm ; 2.05x2.91 in)' },
  { value: 'A9', label: 'A9 (37x52 mm ; 1.46x2.05 in)' },
  { value: 'A10', label: 'A10 (26x37 mm ; 1.02x1.46 in)' },
  { value: 'A11', label: 'A11 (18x26 mm ; 0.71x1.02 in)' },
  { value: 'A12', label: 'A12 (13x18 mm ; 0.51x0.71 in)' },
  // B-series
  { value: 'B0', label: 'B0 (1000x1414 mm ; 39.37x55.67 in)' },
  { value: 'B1', label: 'B1 (707x1000 mm ; 27.83x39.37 in)' },
  { value: 'B2', label: 'B2 (500x707 mm ; 19.69x27.83 in)' },
  { value: 'B3', label: 'B3 (353x500 mm ; 13.90x19.69 in)' },
  { value: 'B4', label: 'B4 (250x353 mm ; 9.84x13.90 in)' },
  { value: 'B5', label: 'B5 (176x250 mm ; 6.93x9.84 in)' },
  { value: 'B6', label: 'B6 (125x176 mm ; 4.92x6.93 in)' },
  { value: 'B7', label: 'B7 (88x125 mm ; 3.46x4.92 in)' },
  { value: 'B8', label: 'B8 (62x88 mm ; 2.44x3.46 in)' },
  { value: 'B9', label: 'B9 (44x62 mm ; 1.73x2.44 in)' },
  { value: 'B10', label: 'B10 (31x44 mm ; 1.22x1.73 in)' },
  { value: 'B11', label: 'B11 (22x31 mm ; 0.87x1.22 in)' },
  { value: 'B12', label: 'B12 (15x22 mm ; 0.59x0.87 in)' },
  // C-series (+ C76 variant)
  { value: 'C0', label: 'C0 (917x1297 mm ; 36.10x51.06 in)' },
  { value: 'C1', label: 'C1 (648x917 mm ; 25.51x36.10 in)' },
  { value: 'C2', label: 'C2 (458x648 mm ; 18.03x25.51 in)' },
  { value: 'C3', label: 'C3 (324x458 mm ; 12.76x18.03 in)' },
  { value: 'C4', label: 'C4 (229x324 mm ; 9.02x12.76 in)' },
  { value: 'C5', label: 'C5 (162x229 mm ; 6.38x9.02 in)' },
  { value: 'C6', label: 'C6 (114x162 mm ; 4.49x6.38 in)' },
  { value: 'C7', label: 'C7 (81x114 mm ; 3.19x4.49 in)' },
  { value: 'C8', label: 'C8 (57x81 mm ; 2.24x3.19 in)' },
  { value: 'C9', label: 'C9 (40x57 mm ; 1.57x2.24 in)' },
  { value: 'C10', label: 'C10 (28x40 mm ; 1.10x1.57 in)' },
  { value: 'C11', label: 'C11 (20x28 mm ; 0.79x1.10 in)' },
  { value: 'C12', label: 'C12 (14x20 mm ; 0.55x0.79 in)' },
  { value: 'C76', label: 'C76 (81x162 mm ; 3.19x6.38 in)' },
  // Custom barcode sizes
  { value: 'CB1', label: 'Custom Barcode (100x25 mm)' },
  { value: 'CB2', label: 'Custom Barcode Type 2 (50x25 mm)' },
  // ANSI (kept from previous set)
  { value: 'Letter', label: 'Letter (215.9x279.4 mm ; 8.5x11 in)' },
  { value: 'Legal', label: 'Legal (215.9x355.6 mm ; 8.5x14 in)' },
]

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
