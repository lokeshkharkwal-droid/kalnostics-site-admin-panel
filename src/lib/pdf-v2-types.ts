/**
 * Frontend mirror of `backend/src/modules/pdf-v2/types.ts`.
 *
 * Kept structurally identical so the editor can be type-safe against
 * the same documents the backend renders. If the backend `types.ts`
 * changes, update this in lockstep — there's no shared package yet.
 */

export interface AdvanceDocument {
  version: 1;
  page:    PageSettings;
  theme:   Theme;
  header:  RepeatRegion;
  footer:  RepeatRegion;
  body:    { blocks: Block[] };
}

export interface PageSettings {
  size:        'A4' | 'A5' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins:     { top: string; right: string; bottom: string; left: string };
  background?: { image?: string; color?: string; fit?: 'cover' | 'contain' };
  default_font: { family: string; size: number; color: string };
}

export interface Theme {
  colors: { brand: string; muted: string; danger: string; warning: string; success: string; bg: string; text: string };
  fonts:  { heading: string; body: string };
}

export interface RepeatRegion {
  height: string;
  blocks: Block[];
}

export interface BlockStyle {
  font_family?:    string;
  font_size?:      number;
  font_weight?:    number | 'normal' | 'bold';
  font_style?:     'normal' | 'italic';
  color?:          string;
  background?:     string;
  align?:          'left' | 'center' | 'right' | 'justify';
  padding?:        string | { top?: string; right?: string; bottom?: string; left?: string };
  margin?:         string | { top?: string; right?: string; bottom?: string; left?: string };
  width?:          string;
  border?:         string;
  border_radius?:  string;
  text_transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  line_height?:    number | string;
  letter_spacing?: string;
}

// ─── Block discriminated union ──────────────────────────────────────────

export type Block =
  | HeadingBlock | ParagraphBlock | KvBlock | DividerBlock | SpacerBlock | PageBreakBlock
  | ImageBlock | LogoBlock | QrBlock | SignatureBlock
  | ColumnsBlock | SectionBlock
  | TableBlock | ParametersTableBlock
  | RangeBarBlock | ScoreCircleBlock | StatusPillBlock | ResultCardBlock | NoteCardBlock
  | OrganDiagramBlock | DonutChartBlock | BarChartBlock | LineChartBlock
  | RepeatBlock | ConditionalBlock
  | PageNumberBlock;

export type BlockType = Block['type'];

export interface SectionBlock    { id: string; type: 'section';    props: { blocks: Block[] }; style?: BlockStyle; }
export interface ColumnsBlock    { id: string; type: 'columns';    props: { columns: Array<{ width?: string; blocks: Block[] }>; gap?: string }; style?: BlockStyle; }
export interface DividerBlock    { id: string; type: 'divider';    props: { thickness?: string; color?: string }; style?: BlockStyle; }
export interface SpacerBlock     { id: string; type: 'spacer';     props: { height: string }; style?: BlockStyle; }
export interface PageBreakBlock  { id: string; type: 'page-break'; props: Record<string, never>; style?: BlockStyle; }

export interface HeadingBlock    { id: string; type: 'heading';    props: { level: 1 | 2 | 3 | 4; text: string }; style?: BlockStyle; }
export interface ParagraphBlock  { id: string; type: 'paragraph';  props: { text: string }; style?: BlockStyle; }
export interface KvBlock         { id: string; type: 'kv';         props: { label: string; value: string }; style?: BlockStyle; }

export interface ImageBlock      { id: string; type: 'image';      props: { src: string; alt?: string; width?: string; height?: string; fit?: 'cover' | 'contain' }; style?: BlockStyle; }
export interface LogoBlock       { id: string; type: 'logo';       props: { width?: string }; style?: BlockStyle; }
export interface QrBlock         { id: string; type: 'qr';         props: { value: string; size?: string }; style?: BlockStyle; }
export interface SignatureBlock  { id: string; type: 'signature';  props: { name: string; title?: string; src?: string }; style?: BlockStyle; }

export interface TableBlock {
  id: string; type: 'table';
  props: {
    columns: Array<{ key: string; label: string; width?: string }>;
    rows:    string | Array<Record<string, string>>;
    striped?: boolean;
  };
  style?: BlockStyle;
}
export interface ParametersTableBlock {
  id: string; type: 'parameters-table';
  props: { items: string; columns?: Array<'status' | 'name' | 'value' | 'unit' | 'range'> };
  style?: BlockStyle;
}

export interface RangeBarBlock {
  id: string; type: 'range-bar';
  props: {
    title?: string;
    value: string | number;
    low?: string | number;
    normal_low?: string | number;
    normal_high?: string | number;
    high?: string | number;
    unit?: string;
    description?: string;
  };
  style?: BlockStyle;
}
export interface ScoreCircleBlock {
  id: string; type: 'score-circle';
  props: { value: string | number; max?: string | number; label?: string };
  style?: BlockStyle;
}
export interface StatusPillBlock {
  id: string; type: 'status-pill';
  props: { status: 'normal' | 'borderline' | 'abnormal' | string; label?: string };
  style?: BlockStyle;
}

export interface ResultCardBlock {
  id: string; type: 'result-card';
  props: { item: string; description?: string; reason_title?: string };
  style?: BlockStyle;
}

export interface NoteCardBlock {
  id: string; type: 'note-card';
  props: { title: string; content: string; hide_when_empty?: boolean };
  style?: BlockStyle;
}

export interface OrganDiagramBlock {
  id: string; type: 'organ-diagram';
  props: { items: string; title?: string };
  style?: BlockStyle;
}
export interface DonutChartBlock {
  id: string; type: 'donut-chart';
  props: { slices: string; title?: string; size?: string };
  style?: BlockStyle;
}
export interface BarChartBlock {
  id: string; type: 'bar-chart';
  props: { bars: string; title?: string; height?: string };
  style?: BlockStyle;
}
export interface LineChartBlock {
  id: string; type: 'line-chart';
  props: { points: string; title?: string; height?: string; color?: string };
  style?: BlockStyle;
}

export interface PageNumberBlock {
  id: string; type: 'page-number';
  props: { format?: string };
  style?: BlockStyle;
}

export interface RepeatBlock {
  id: string; type: 'repeat';
  props: { items: string; as: string; blocks: Block[] };
  style?: BlockStyle;
}
export interface ConditionalBlock {
  id: string; type: 'conditional';
  props: { when: string; blocks: Block[] };
  style?: BlockStyle;
}

export type AdvanceContextType = 'lab_report' | 'order_invoice' | 'order_bill';

/** Path into the document — sequence of object keys / array indices.
 *  e.g. `['body', 'blocks', 0]` → first body block. */
export type DocPath = Array<string | number>;
