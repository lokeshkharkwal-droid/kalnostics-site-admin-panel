/**
 * Palette / tree metadata for every block type — what to label it in
 * the UI, what icon to show, and what category to group it under.
 * Pure data, no React imports so it can be reused outside the editor.
 */

import type { BlockType } from '@/lib/pdf-v2-types';

export type PaletteCategory = 'Layout' | 'Text' | 'Media' | 'Tabular' | 'Visualization' | 'Flow';

export interface BlockMeta {
  label:       string;
  category:    PaletteCategory;
  description: string;
  /** SVG path (24x24 outline) shown in palette/tree. */
  icon:        string;
  /** True when the block contains child block arrays — drives tree expand/collapse. */
  isContainer: boolean;
}

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  // Layout
  section: {
    label: 'Section', category: 'Layout',
    description: 'Group of blocks with shared styling.',
    icon: 'M4 6h16M4 12h16M4 18h16',
    isContainer: true,
  },
  columns: {
    label: 'Columns', category: 'Layout',
    description: 'Side-by-side columns. Each holds its own blocks.',
    icon: 'M4 4h6v16H4zM14 4h6v16h-6z',
    isContainer: true,
  },
  divider: {
    label: 'Divider', category: 'Layout',
    description: 'Horizontal rule between blocks.',
    icon: 'M4 12h16',
    isContainer: false,
  },
  spacer: {
    label: 'Spacer', category: 'Layout',
    description: 'Empty vertical space.',
    icon: 'M12 4v16',
    isContainer: false,
  },
  'page-break': {
    label: 'Page break', category: 'Layout',
    description: 'Force a new page below this point.',
    icon: 'M6 4h12M6 12h12M6 20h12M3 8l3 4-3 4M21 8l-3 4 3 4',
    isContainer: false,
  },
  'page-number': {
    label: 'Page Number', category: 'Layout',
    description: 'Live page counter — only fills in inside header/footer regions.',
    icon: 'M4 4h16v16H4zM8 8h2v8H8zM12 8h4v4h-4zM12 14h4v2h-4z',
    isContainer: false,
  },

  // Text
  heading: {
    label: 'Heading', category: 'Text',
    description: 'H1 / H2 / H3 / H4 title.',
    icon: 'M4 4v16M14 4v16M4 12h10',
    isContainer: false,
  },
  paragraph: {
    label: 'Paragraph', category: 'Text',
    description: 'Plain prose. Supports {tokens}.',
    icon: 'M4 6h16M4 10h16M4 14h12M4 18h10',
    isContainer: false,
  },
  kv: {
    label: 'Label : Value', category: 'Text',
    description: 'Small label above a value (patient row, order summary).',
    icon: 'M4 6h6M4 10h10M14 6h6M14 10h6',
    isContainer: false,
  },

  // Media
  image: {
    label: 'Image', category: 'Media',
    description: 'External image URL or data URI.',
    icon: 'M4 4h16v16H4zM4 16l4-4 3 3 4-5 5 6',
    isContainer: false,
  },
  logo: {
    label: 'Branch Logo', category: 'Media',
    description: 'Resolves to {branch.logo} automatically.',
    icon: 'M4 4h16v16H4zM4 16l4-4 3 3 4-5 5 6',
    isContainer: false,
  },
  qr: {
    label: 'QR Code', category: 'Media',
    description: 'Encodes a token value as a QR code.',
    icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2M16 16v2M18 18v2',
    isContainer: false,
  },
  signature: {
    label: 'Signature', category: 'Media',
    description: 'Signature line with name + title.',
    icon: 'M4 16c4 0 4-8 8-8s4 8 8 8',
    isContainer: false,
  },

  // Tabular
  table: {
    label: 'Table', category: 'Tabular',
    description: 'Generic table with named columns.',
    icon: 'M4 4h16v4H4zM4 8h16v4H4zM4 12h16v4H4zM4 16h16v4H4z',
    isContainer: false,
  },
  'parameters-table': {
    label: 'Parameters Table', category: 'Tabular',
    description: 'Lab-result table with status colors.',
    icon: 'M4 4h16v4H4zM4 8h16v4H4zM4 12h16v4H4z',
    isContainer: false,
  },

  // Visualization
  'range-bar': {
    label: 'Range Bar', category: 'Visualization',
    description: 'Low / Normal / High bar with a marker.',
    icon: 'M3 12h18M9 12v-3M15 12v3',
    isContainer: false,
  },
  'score-circle': {
    label: 'Score Circle', category: 'Visualization',
    description: 'Circular gauge showing a numeric score.',
    icon: 'M12 4a8 8 0 100 16 8 8 0 000-16zM8 12l3 3 5-6',
    isContainer: false,
  },
  'status-pill': {
    label: 'Status Pill', category: 'Visualization',
    description: 'Coloured dot + label (Normal / Borderline / Abnormal).',
    icon: 'M5 12a7 7 0 1014 0 7 7 0 00-14 0z',
    isContainer: false,
  },
  'result-card': {
    label: 'Result Card', category: 'Visualization',
    description: 'Rich one-result card — auto range bar + abnormal-reason callout.',
    icon: 'M4 5h16v14H4zM4 9h16M9 9v10',
    isContainer: false,
  },
  'note-card': {
    label: 'Note Card', category: 'Visualization',
    description: 'Bordered "i" callout with a rich-text note (Test Note / Overall Result Note / etc).',
    icon: 'M4 4h16v16H4zM7 8h10M7 12h10M7 16h7',
    isContainer: false,
  },
  'organ-diagram': {
    label: 'Organ Diagram', category: 'Visualization',
    description: 'Body silhouette with per-organ status pills.',
    icon: 'M12 3a3 3 0 100 6 3 3 0 000-6zM8 13h8v8H8z',
    isContainer: false,
  },
  'donut-chart': {
    label: 'Donut Chart', category: 'Visualization',
    description: 'Donut + legend; array of slices with label/value.',
    icon: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8a4 4 0 100 8 4 4 0 000-8z',
    isContainer: false,
  },
  'bar-chart': {
    label: 'Bar Chart', category: 'Visualization',
    description: 'Vertical bars from an array of label+value items.',
    icon: 'M5 20V10M11 20V4M17 20V14',
    isContainer: false,
  },
  'line-chart': {
    label: 'Line Chart', category: 'Visualization',
    description: 'Line + dots from an array of {x, y} points.',
    icon: 'M4 17l5-5 4 4 7-9',
    isContainer: false,
  },

  // Flow
  repeat: {
    label: 'Repeat', category: 'Flow',
    description: 'Render child blocks once per array item.',
    icon: 'M4 4h11M4 4v6M4 10h11M4 10v6M4 16h11M19 4l2 3-2 3M19 14l2 3-2 3',
    isContainer: true,
  },
  conditional: {
    label: 'Conditional', category: 'Flow',
    description: 'Render only when an expression is truthy.',
    icon: 'M5 6h6l3 6-3 6H5M19 6v12',
    isContainer: true,
  },
};

export const PALETTE_ORDER: PaletteCategory[] = ['Layout', 'Text', 'Media', 'Tabular', 'Visualization', 'Flow'];

export function blocksByCategory(): Record<PaletteCategory, BlockType[]> {
  const out: Record<PaletteCategory, BlockType[]> = {
    Layout: [], Text: [], Media: [], Tabular: [], Visualization: [], Flow: [],
  };
  for (const [type, meta] of Object.entries(BLOCK_META)) {
    out[meta.category].push(type as BlockType);
  }
  return out;
}
