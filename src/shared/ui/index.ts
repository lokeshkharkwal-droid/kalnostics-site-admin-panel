export { Button } from './button'
export { Input } from './input'
export { Badge } from './badge'
export { Card, CardHeader, CardTitle, CardContent } from './card'
export { Spinner, PageLoader } from './spinner'
export { PasswordInput } from './password-input'
export { PhoneInput, parsePhone, PHONE_COUNTRIES, type CountryCode } from './phone-input'
export { PaginatedSelect, type SelectOption, type PageResult } from './paginated-select'
export { ModuleMultiSelect } from './module-multi-select'
export { Toggle } from './toggle'
export { Modal } from './modal'
export { Label, SelectField, TextArea } from './form-controls'
export { DataTable, type Column, type TablePagination } from './data-table'
export { ActionMenu, type ActionMenuItem } from './action-menu'
export { RadioGroup, type RadioOption } from './radio-group'
// NOTE: `HtmlEditor` (TinyMCE) is intentionally NOT re-exported here — like
// `RichEditor`, it pulls in a large, browser-only module graph. Import it lazily
// where used: `dynamic(() => import('@/shared/ui/html-editor').then(m => m.HtmlEditor), { ssr: false })`.
export { PdfPreviewOverlay } from './pdf-preview-overlay'
// NOTE: `RichEditor` is intentionally NOT re-exported here. It pulls in the full
// tiptap + ProseMirror module graph (very large). Re-exporting it from this
// barrel forced every one of the ~79 files that import from `@/shared/ui` to
// compile that graph — the main cause of the 1–2s per-route delay in `next dev`
// (and dead weight in the production bundle). Import it directly and lazily
// where it's actually used: `dynamic(() => import('@/shared/ui/rich-editor'))`.
