'use client';

import { createContext, useContext } from 'react';
import type { Block, AdvanceContextType } from '@/lib/pdf-v2-types';
import { StylePanel } from './StylePanel';
import { ImageUploadButton } from './ImageUploadButton';
import { TokenAutocomplete } from './TokenAutocomplete';
import { BLOCK_META } from '../utils/block-meta';

// Context-type carrier — every `TokenField` reads from here so the
// autocomplete dropdown shows the right token catalog. Default is
// lab_report; the editor sets the real value via the provider below.
const ContextTypeCtx = createContext<AdvanceContextType>('lab_report');

/**
 * Right-pane editor for a selected block. Switches its props form on
 * `block.type`; every block also gets the shared StylePanel below.
 *
 * Each per-type form is a thin wrapper over the same set of form atoms
 * (TextField / NumField / SelectField / TokenField). Adding a new
 * block type? Add one case here + an entry in BLOCK_META and you're
 * done — the rest of the editor is data-driven.
 */

interface Props {
  block:       Block;
  onChange:    (next: Block) => void;
  contextType: AdvanceContextType;
}

export function PropertiesPanel({ block, onChange, contextType }: Props) {
  const meta = BLOCK_META[block.type];
  return (
    <ContextTypeCtx.Provider value={contextType}>
    <div className="space-y-4">
      <header className="space-y-1 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
          </svg>
          <h3 className="text-sm font-semibold text-slate-800">{meta.label}</h3>
        </div>
        <p className="text-[11px] text-slate-500 italic">{meta.description}</p>
      </header>

      <PropsFor block={block} onChange={onChange} />

      <div className="pt-3">
        <StylePanel
          style={block.style}
          onChange={(next) => onChange({ ...block, style: next } as Block)}
        />
      </div>
    </div>
    </ContextTypeCtx.Provider>
  );
}

// ─── Per-type forms ─────────────────────────────────────────────────────

function PropsFor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  // TS narrowing per block.type. Cast inside each branch to keep changes
  // typed.
  switch (block.type) {
    case 'heading': {
      return (
        <Stack>
          <SelectField
            label="Level"
            value={String(block.props.level)}
            options={[['1', 'H1'], ['2', 'H2'], ['3', 'H3'], ['4', 'H4']]}
            onChange={(v) => onChange({ ...block, props: { ...block.props, level: Number(v) as 1 | 2 | 3 | 4 } })}
          />
          <TokenField label="Text" value={block.props.text}
            onChange={(v) => onChange({ ...block, props: { ...block.props, text: v } })} />
        </Stack>
      );
    }
    case 'paragraph': {
      return (
        <Stack>
          <TokenField label="Text" multiline value={block.props.text}
            onChange={(v) => onChange({ ...block, props: { ...block.props, text: v } })} />
        </Stack>
      );
    }
    case 'kv': {
      return (
        <Stack>
          <TokenField label="Label" value={block.props.label}
            onChange={(v) => onChange({ ...block, props: { ...block.props, label: v } })} />
          <TokenField label="Value" value={block.props.value}
            onChange={(v) => onChange({ ...block, props: { ...block.props, value: v } })} />
        </Stack>
      );
    }
    case 'divider': {
      return (
        <Stack>
          <TextField label="Thickness" value={block.props.thickness ?? ''} placeholder="1px"
            onChange={(v) => onChange({ ...block, props: { ...block.props, thickness: v || undefined } })} />
          <TextField label="Color" value={block.props.color ?? ''} placeholder="#e2e8f0"
            onChange={(v) => onChange({ ...block, props: { ...block.props, color: v || undefined } })} />
        </Stack>
      );
    }
    case 'spacer': {
      return (
        <Stack>
          <TextField label="Height" value={block.props.height} placeholder="8mm"
            onChange={(v) => onChange({ ...block, props: { height: v } })} />
        </Stack>
      );
    }
    case 'page-break': {
      return <p className="text-[11px] text-slate-500 italic">No options — forces a new page below this block.</p>;
    }
    case 'page-number': {
      return (
        <Stack>
          <TextField label="Format" value={block.props.format ?? ''} placeholder="Page {n} of {total}"
            onChange={(v) => onChange({ ...block, props: { ...block.props, format: v || undefined } })} />
          <Hint>
            Use <code>{'{n}'}</code> for the current page and <code>{'{total}'}</code> for total pages.
            Only fills in when this block is inside the document&apos;s header or footer.
          </Hint>
        </Stack>
      );
    }
    case 'image': {
      return (
        <Stack>
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-500 mb-0.5">Source</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={block.props.src}
                onChange={(e) => onChange({ ...block, props: { ...block.props, src: e.target.value } })}
                placeholder="https://… or upload →"
                className="w-full h-7 px-2 rounded border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <ImageUploadButton
                label="Upload"
                onUploaded={(url) => onChange({ ...block, props: { ...block.props, src: url } })}
              />
            </div>
            {block.props.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.props.src} alt="" className="mt-1 h-12 w-auto rounded border border-slate-200 object-contain bg-slate-50" />
            )}
          </div>
          <TextField label="Alt" value={block.props.alt ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, alt: v || undefined } })} />
          <Row>
            <TextField label="Width"  value={block.props.width  ?? ''} placeholder="120px"
              onChange={(v) => onChange({ ...block, props: { ...block.props, width:  v || undefined } })} />
            <TextField label="Height" value={block.props.height ?? ''} placeholder="auto"
              onChange={(v) => onChange({ ...block, props: { ...block.props, height: v || undefined } })} />
          </Row>
          <SelectField label="Fit" value={block.props.fit ?? ''} options={[['', '—'], ['cover', 'cover'], ['contain', 'contain']]}
            onChange={(v) => onChange({ ...block, props: { ...block.props, fit: v === '' ? undefined : (v as 'cover' | 'contain') } })} />
        </Stack>
      );
    }
    case 'logo': {
      return (
        <Stack>
          <TextField label="Width" value={block.props.width ?? ''} placeholder="120px"
            onChange={(v) => onChange({ ...block, props: { ...block.props, width: v || undefined } })} />
          <Hint>Source resolves automatically to <code>{'{branch.logo}'}</code>.</Hint>
        </Stack>
      );
    }
    case 'qr': {
      return (
        <Stack>
          <TokenField label="Value" value={block.props.value}
            onChange={(v) => onChange({ ...block, props: { ...block.props, value: v } })} />
          <TextField label="Size" value={block.props.size ?? ''} placeholder="120px"
            onChange={(v) => onChange({ ...block, props: { ...block.props, size: v || undefined } })} />
        </Stack>
      );
    }
    case 'signature': {
      return (
        <Stack>
          <TokenField label="Name" value={block.props.name}
            onChange={(v) => onChange({ ...block, props: { ...block.props, name: v } })} />
          <TokenField label="Title" value={block.props.title ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, title: v || undefined } })} />
          <div className="space-y-1">
            <span className="block text-[10px] text-slate-500 mb-0.5">Signature image</span>
            <div className="flex items-center gap-1">
              <input type="text" value={block.props.src ?? ''}
                onChange={(e) => onChange({ ...block, props: { ...block.props, src: e.target.value || undefined } })}
                placeholder="URL or upload →"
                className="w-full h-7 px-2 rounded border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500" />
              <ImageUploadButton
                label="Upload"
                onUploaded={(url) => onChange({ ...block, props: { ...block.props, src: url } })}
              />
            </div>
          </div>
        </Stack>
      );
    }
    case 'table': {
      return (
        <Stack>
          <Hint>Columns are key/label/width triples; rows is a token pointing to an array of objects.</Hint>
          <TokenField label="Rows (array token)" value={typeof block.props.rows === 'string' ? block.props.rows : ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, rows: v } })} />
          <CheckField label="Striped rows" value={!!block.props.striped}
            onChange={(v) => onChange({ ...block, props: { ...block.props, striped: v } })} />
          <Label>Columns</Label>
          <div className="space-y-2">
            {block.props.columns.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-1.5 items-end">
                <div className="col-span-4"><TextField label="Key"   value={c.key}   onChange={(v) => onChange(updateColumn(block, i, { key: v }))} /></div>
                <div className="col-span-5"><TextField label="Label" value={c.label} onChange={(v) => onChange(updateColumn(block, i, { label: v }))} /></div>
                <div className="col-span-2"><TextField label="Width" value={c.width ?? ''} placeholder="20%" onChange={(v) => onChange(updateColumn(block, i, { width: v || undefined }))} /></div>
                <button type="button" className="col-span-1 text-xs text-rose-600 hover:text-rose-700 h-7"
                  onClick={() => onChange(removeColumn(block, i))}>×</button>
              </div>
            ))}
            <button type="button" className="text-xs text-sky-600 hover:text-sky-700 underline"
              onClick={() => onChange(addColumn(block))}>+ Add column</button>
          </div>
        </Stack>
      );
    }
    case 'parameters-table': {
      const allCols: Array<'status' | 'name' | 'value' | 'unit' | 'range'> = ['status', 'name', 'value', 'unit', 'range'];
      return (
        <Stack>
          <TokenField label="Items (array token)" value={block.props.items}
            onChange={(v) => onChange({ ...block, props: { ...block.props, items: v } })} />
          <Label>Visible columns</Label>
          <div className="grid grid-cols-2 gap-1">
            {allCols.map((c) => {
              const present = (block.props.columns ?? allCols).includes(c);
              return (
                <CheckField
                  key={c} label={c}
                  value={present}
                  onChange={(checked) => {
                    const cur = block.props.columns ?? [...allCols];
                    const next = checked ? [...cur, c].filter((x, i, a) => a.indexOf(x) === i) : cur.filter((x) => x !== c);
                    onChange({ ...block, props: { ...block.props, columns: next } });
                  }}
                />
              );
            })}
          </div>
        </Stack>
      );
    }
    case 'range-bar': {
      return (
        <Stack>
          <TokenField label="Title (optional)" value={block.props.title ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, title: v || undefined } })} />
          <TokenField label="Value" value={String(block.props.value ?? '')}
            onChange={(v) => onChange({ ...block, props: { ...block.props, value: parseMaybeNumber(v) } })} />
          <Row>
            <TokenField label="Low"         value={String(block.props.low         ?? '')} onChange={(v) => onChange({ ...block, props: { ...block.props, low:         parseMaybeNumber(v) } })} />
            <TokenField label="Normal min"  value={String(block.props.normal_low  ?? '')} onChange={(v) => onChange({ ...block, props: { ...block.props, normal_low:  parseMaybeNumber(v) } })} />
            <TokenField label="Normal max"  value={String(block.props.normal_high ?? '')} onChange={(v) => onChange({ ...block, props: { ...block.props, normal_high: parseMaybeNumber(v) } })} />
            <TokenField label="High"        value={String(block.props.high        ?? '')} onChange={(v) => onChange({ ...block, props: { ...block.props, high:        parseMaybeNumber(v) } })} />
          </Row>
          <Row>
            <TextField label="Unit" value={block.props.unit ?? ''}
              onChange={(v) => onChange({ ...block, props: { ...block.props, unit: v || undefined } })} />
          </Row>
          <TokenField label="Description" multiline value={block.props.description ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, description: v || undefined } })} />
        </Stack>
      );
    }
    case 'score-circle': {
      return (
        <Stack>
          <TokenField label="Value" value={String(block.props.value ?? '')}
            onChange={(v) => onChange({ ...block, props: { ...block.props, value: parseMaybeNumber(v) } })} />
          <TokenField label="Max" value={String(block.props.max ?? '')}
            onChange={(v) => onChange({ ...block, props: { ...block.props, max: parseMaybeNumber(v) } })} />
          <TokenField label="Label (optional)" value={block.props.label ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, label: v || undefined } })} />
        </Stack>
      );
    }
    case 'status-pill': {
      return (
        <Stack>
          <TokenField label="Status (normal | borderline | abnormal | token)" value={block.props.status}
            onChange={(v) => onChange({ ...block, props: { ...block.props, status: v } })} />
          <TokenField label="Label (optional)" value={block.props.label ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, label: v || undefined } })} />
        </Stack>
      );
    }
    case 'result-card': {
      return (
        <Stack>
          <TokenField label="Item (single result token)" value={block.props.item}
            onChange={(v) => onChange({ ...block, props: { ...block.props, item: v } })} />
          <TokenField label="Description (optional)" multiline value={block.props.description ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, description: v || undefined } })} />
          <TextField label="Reason callout title" value={block.props.reason_title ?? ''} placeholder="Common Abnormal Reasons"
            onChange={(v) => onChange({ ...block, props: { ...block.props, reason_title: v || undefined } })} />
          <Hint>
            Place inside a <code>repeat</code> over <code>{'{test.results}'}</code> with <code>as: r</code>;
            bind item to <code>{'{r}'}</code>. Range bar shows when value is numeric and ranges are set;
            callout shows when <code>abnormal_reason</code> is non-empty.
          </Hint>
        </Stack>
      );
    }
    case 'note-card': {
      return (
        <Stack>
          <TokenField label="Title" value={block.props.title}
            onChange={(v) => onChange({ ...block, props: { ...block.props, title: v } })} />
          <TokenField label="Content (HTML)" multiline value={block.props.content}
            onChange={(v) => onChange({ ...block, props: { ...block.props, content: v } })} />
          <CheckField label="Hide when content is empty" value={block.props.hide_when_empty !== false}
            onChange={(v) => onChange({ ...block, props: { ...block.props, hide_when_empty: v } })} />
          <Hint>
            Pair with <code>{'{test.test_note}'}</code>, <code>{'{test.overall_result_note}'}</code>,
            or <code>{'{test.test_comment}'}</code> inside a per-test repeat.
          </Hint>
        </Stack>
      );
    }
    case 'organ-diagram': {
      return (
        <Stack>
          <TokenField label="Title (optional)" value={block.props.title ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, title: v || undefined } })} />
          <TokenField label="Items (array token)" value={block.props.items}
            onChange={(v) => onChange({ ...block, props: { ...block.props, items: v } })} />
          <Hint>Each item should expose <code>name</code> + <code>status</code> (normal / borderline / abnormal). Up to 8 items shown.</Hint>
        </Stack>
      );
    }
    case 'donut-chart': {
      return (
        <Stack>
          <TokenField label="Title (optional)" value={block.props.title ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, title: v || undefined } })} />
          <TokenField label="Slices (array token)" value={block.props.slices}
            onChange={(v) => onChange({ ...block, props: { ...block.props, slices: v } })} />
          <TextField label="Size" value={block.props.size ?? ''} placeholder="160px"
            onChange={(v) => onChange({ ...block, props: { ...block.props, size: v || undefined } })} />
          <Hint>Each slice: <code>{'{ label, value, color? }'}</code>.</Hint>
        </Stack>
      );
    }
    case 'bar-chart': {
      return (
        <Stack>
          <TokenField label="Title (optional)" value={block.props.title ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, title: v || undefined } })} />
          <TokenField label="Bars (array token)" value={block.props.bars}
            onChange={(v) => onChange({ ...block, props: { ...block.props, bars: v } })} />
          <TextField label="Height" value={block.props.height ?? ''} placeholder="120px"
            onChange={(v) => onChange({ ...block, props: { ...block.props, height: v || undefined } })} />
          <Hint>Each bar: <code>{'{ label, value, color? }'}</code>.</Hint>
        </Stack>
      );
    }
    case 'line-chart': {
      return (
        <Stack>
          <TokenField label="Title (optional)" value={block.props.title ?? ''}
            onChange={(v) => onChange({ ...block, props: { ...block.props, title: v || undefined } })} />
          <TokenField label="Points (array token)" value={block.props.points}
            onChange={(v) => onChange({ ...block, props: { ...block.props, points: v } })} />
          <Row>
            <TextField label="Height" value={block.props.height ?? ''} placeholder="120px"
              onChange={(v) => onChange({ ...block, props: { ...block.props, height: v || undefined } })} />
            <TextField label="Color" value={block.props.color ?? ''} placeholder="#0ea5e9"
              onChange={(v) => onChange({ ...block, props: { ...block.props, color: v || undefined } })} />
          </Row>
          <Hint>Each point: <code>{'{ x, y }'}</code>.</Hint>
        </Stack>
      );
    }
    case 'columns': {
      return (
        <Stack>
          <TextField label="Gap" value={block.props.gap ?? ''} placeholder="12px"
            onChange={(v) => onChange({ ...block, props: { ...block.props, gap: v || undefined } })} />
          <Label>Columns</Label>
          <div className="space-y-2">
            {block.props.columns.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-1.5 items-end">
                <div className="col-span-10">
                  <TextField label={`Column ${i + 1} width`} value={c.width ?? ''} placeholder="50% / 60mm"
                    onChange={(v) => {
                      const cols = block.props.columns.slice();
                      cols[i] = { ...cols[i], width: v || undefined };
                      onChange({ ...block, props: { ...block.props, columns: cols } });
                    }} />
                </div>
                <button type="button" className="col-span-2 text-xs text-rose-600 hover:text-rose-700 h-7" disabled={block.props.columns.length <= 1}
                  onClick={() => {
                    const cols = block.props.columns.slice();
                    cols.splice(i, 1);
                    onChange({ ...block, props: { ...block.props, columns: cols } });
                  }}>Remove</button>
              </div>
            ))}
            <button type="button" className="text-xs text-sky-600 hover:text-sky-700 underline"
              onClick={() => onChange({ ...block, props: { ...block.props, columns: [...block.props.columns, { blocks: [] }] } })}>
              + Add column
            </button>
          </div>
          <Hint>Add blocks into each column from the tree on the left.</Hint>
        </Stack>
      );
    }
    case 'section': {
      return <Hint>Use the tree to add child blocks. Section is a styling wrapper for a group of blocks.</Hint>;
    }
    case 'repeat': {
      return (
        <Stack>
          <TokenField label="Items (array token)" value={block.props.items}
            onChange={(v) => onChange({ ...block, props: { ...block.props, items: v } })} />
          <TextField label="Iterator name" value={block.props.as} placeholder="item"
            onChange={(v) => onChange({ ...block, props: { ...block.props, as: v || 'item' } })} />
          <Hint>Inside this block, child tokens reference <code>{'{<name>.field}'}</code>.</Hint>
        </Stack>
      );
    }
    case 'conditional': {
      return (
        <Stack>
          <TextField label="When" value={block.props.when} placeholder="{a} > 0 && {b} != 'x'"
            onChange={(v) => onChange({ ...block, props: { ...block.props, when: v } })} />
          <Hint>
            Truthy → render. Supports <code>==</code> <code>!=</code> <code>&lt;</code> <code>&lt;=</code> <code>&gt;</code> <code>&gt;=</code>,
            <code>&amp;&amp;</code> / <code>||</code>, and a leading <code>!</code>.
            Numeric when both sides parse as numbers; otherwise lexical.
          </Hint>
        </Stack>
      );
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

function parseMaybeNumber(v: string): string | number {
  if (v === '') return v;
  if (v.startsWith('{')) return v;            // token expression — keep as string
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

function updateColumn(
  block: Extract<Block, { type: 'table' }>,
  i: number,
  patch: Partial<Extract<Block, { type: 'table' }>['props']['columns'][number]>,
): Block {
  const cols = block.props.columns.slice();
  cols[i] = { ...cols[i], ...patch };
  return { ...block, props: { ...block.props, columns: cols } };
}

function addColumn(block: Extract<Block, { type: 'table' }>): Block {
  return {
    ...block,
    props: { ...block.props, columns: [...block.props.columns, { key: 'col', label: 'Column' }] },
  };
}

function removeColumn(block: Extract<Block, { type: 'table' }>, i: number): Block {
  const cols = block.props.columns.slice();
  cols.splice(i, 1);
  return { ...block, props: { ...block.props, columns: cols } };
}

// ─── Form atoms ─────────────────────────────────────────────────────────

const inputCls =
  'w-full h-7 px-2 rounded border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500';

function Stack({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{children}</label>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-slate-500 italic">{children}</p>;
}

function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[10px] text-slate-500 mb-0.5">{label}</span>
      <input type="text" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  );
}

function TokenField({ label, value, multiline, onChange }: { label: string; value: string; multiline?: boolean; onChange: (v: string) => void }) {
  const contextType = useContext(ContextTypeCtx);
  return (
    <label className="block">
      <span className="block text-[10px] text-slate-500 mb-0.5">{label}</span>
      <TokenAutocomplete
        value={value}
        onChange={onChange}
        contextType={contextType}
        multiline={multiline}
      />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[10px] text-slate-500 mb-0.5">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-slate-700">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="capitalize">{label}</span>
    </label>
  );
}
