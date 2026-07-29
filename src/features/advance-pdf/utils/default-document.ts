import type { AdvanceDocument } from '@/lib/pdf-v2-types'

/**
 * Seed document for a brand-new Advance PDF template. Mirrors the backend's
 * `defaultDocument()` so a freshly-created template renders something sensible
 * before the user edits it. Sent as the `doc` on create, and used as a fallback
 * when a loaded template has no `doc` (e.g. a classic HTML template opened in
 * the block editor).
 */
export function defaultAdvanceDocument(): AdvanceDocument {
  return {
    version: 1,
    page: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
      default_font: { family: 'Inter', size: 11, color: '#0f172a' },
    },
    theme: {
      colors: {
        brand: '#0ea5e9',
        muted: '#64748b',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        bg: '#f8fafc',
        text: '#0f172a',
      },
      fonts: { heading: 'Inter', body: 'Inter' },
    },
    header: { height: '0mm', blocks: [] },
    footer: { height: '0mm', blocks: [] },
    body: {
      blocks: [
        {
          id: 'h1',
          type: 'heading',
          props: { level: 1, text: '{branch.name}' },
          style: { color: '#0ea5e9', font_size: 22, font_weight: 700 },
        },
        {
          id: 'p1',
          type: 'paragraph',
          props: {
            text: 'Welcome to your Advance PDF template. Edit blocks on the right.',
          },
          style: { color: '#64748b' },
        },
        { id: 'd1', type: 'divider', props: {} },
        {
          id: 'k1',
          type: 'kv',
          props: { label: 'Patient', value: '{patient.full_name}' },
        },
        {
          id: 'k2',
          type: 'kv',
          props: { label: 'Order #', value: '{order.display_id}' },
        },
      ],
    },
  }
}
