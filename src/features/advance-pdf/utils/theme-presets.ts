/**
 * Named theme presets — swatch sets that recolor the whole document.
 * Picking a preset replaces the current `theme` block; the default font
 * colour is also nudged to the preset's `text` so body type stays
 * legible against the new background.
 *
 * Add new presets here and they appear in the editor's preset picker.
 * Pure data — no React imports — so the renderer / tests / migrations
 * can also consume the same source of truth.
 */

import type { Theme } from '@/lib/pdf-v2-types';

export interface ThemePreset {
  id:    string;
  label: string;
  /** One-line teaser shown under the swatch. */
  hint:  string;
  theme: Theme;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'clinical',
    label: 'Clinical',
    hint: 'Cool blue, neutral text — the lab-report default.',
    theme: {
      colors: {
        brand:   '#0ea5e9',
        muted:   '#64748b',
        danger:  '#dc2626',
        warning: '#d97706',
        success: '#059669',
        bg:      '#ffffff',
        text:    '#0f172a',
      },
      fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    hint: 'Dark headers and indigo accents for premium reports.',
    theme: {
      colors: {
        brand:   '#4f46e5',
        muted:   '#6b7280',
        danger:  '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        bg:      '#ffffff',
        text:    '#111827',
      },
      fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    hint: 'Green brand for wellness / preventive screenings.',
    theme: {
      colors: {
        brand:   '#047857',
        muted:   '#6b7280',
        danger:  '#b91c1c',
        warning: '#b45309',
        success: '#15803d',
        bg:      '#ffffff',
        text:    '#1f2937',
      },
      fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    hint: 'Warm pink/red — gynecology / fertility reports.',
    theme: {
      colors: {
        brand:   '#be185d',
        muted:   '#6b7280',
        danger:  '#dc2626',
        warning: '#d97706',
        success: '#059669',
        bg:      '#ffffff',
        text:    '#1f2937',
      },
      fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
    },
  },
  {
    id: 'mono',
    label: 'Mono',
    hint: 'Monochrome black/grey — print-friendly invoices.',
    theme: {
      colors: {
        brand:   '#111827',
        muted:   '#6b7280',
        danger:  '#000000',
        warning: '#374151',
        success: '#000000',
        bg:      '#ffffff',
        text:    '#111827',
      },
      fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
    },
  },
  {
    id: 'serif-classic',
    label: 'Serif Classic',
    hint: 'Times-style serif for traditional prescriptions.',
    theme: {
      colors: {
        brand:   '#1e3a8a',
        muted:   '#475569',
        danger:  '#991b1b',
        warning: '#854d0e',
        success: '#166534',
        bg:      '#ffffff',
        text:    '#0f172a',
      },
      fonts: { heading: '"Times New Roman", serif', body: '"Times New Roman", serif' },
    },
  },
];

/** Best-effort match of an existing theme to a preset. Compares by
 *  brand colour first (the most distinctive field), then by `text`.
 *  Returns null when nothing matches — the picker shows "Custom". */
export function matchPreset(theme: Theme): ThemePreset | null {
  for (const p of THEME_PRESETS) {
    if (
      p.theme.colors.brand.toLowerCase() === theme.colors.brand?.toLowerCase() &&
      p.theme.colors.text.toLowerCase()  === theme.colors.text?.toLowerCase()
    ) {
      return p;
    }
  }
  return null;
}
