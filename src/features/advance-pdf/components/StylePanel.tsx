'use client';

import type { BlockStyle } from '@/lib/pdf-v2-types';

/**
 * Shared style-override panel for any selected block. Maps directly to
 * BlockStyle — every change is an immutable update of `selected.style`
 * which the editor pipes back into the document via setPath.
 *
 * Trailing fields (border-radius, letter-spacing, etc.) are exposed via
 * a collapsible Advanced section so the common case stays tidy.
 */

interface Props {
  style: BlockStyle | undefined;
  onChange: (next: BlockStyle | undefined) => void;
}

export function StylePanel({ style, onChange }: Props) {
  // Ensures a particular sub-field exists before we mutate it.
  const upd = (patch: Partial<BlockStyle>) => onChange({ ...(style ?? {}), ...patch });
  const updPad = (k: 'top' | 'right' | 'bottom' | 'left', v: string) => {
    const cur = typeof style?.padding === 'object' ? style.padding : {};
    onChange({ ...(style ?? {}), padding: { ...cur, [k]: v || undefined } });
  };
  const updMar = (k: 'top' | 'right' | 'bottom' | 'left', v: string) => {
    const cur = typeof style?.margin === 'object' ? style.margin : {};
    onChange({ ...(style ?? {}), margin: { ...cur, [k]: v || undefined } });
  };

  // Read padding / margin sub-fields (handle the string-shorthand case
  // by surfacing it in a single "all sides" input).
  const pad = typeof style?.padding === 'object' ? style.padding : {};
  const mar = typeof style?.margin  === 'object' ? style.margin  : {};
  const padShort = typeof style?.padding === 'string' ? style.padding : '';
  const marShort = typeof style?.margin  === 'string' ? style.margin  : '';

  return (
    <div className="space-y-4">
      <SectionHeading label="Style" />

      {/* Typography */}
      <div className="space-y-2">
        <Label>Typography</Label>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Font family">
            <input type="text" placeholder="Inter" value={style?.font_family ?? ''}
              onChange={(e) => upd({ font_family: e.target.value || undefined })}
              className={inputCls} />
          </Field>
          <Field label="Size (pt)">
            <input type="number" min={6} max={96} value={style?.font_size ?? ''}
              onChange={(e) => upd({ font_size: e.target.value === '' ? undefined : Number(e.target.value) })}
              className={inputCls} />
          </Field>
          <Field label="Weight">
            <select value={style?.font_weight ?? ''}
              onChange={(e) => upd({ font_weight: e.target.value === '' ? undefined : (e.target.value as BlockStyle['font_weight']) })}
              className={inputCls}>
              <option value="">—</option>
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value={300}>300</option>
              <option value={400}>400</option>
              <option value={500}>500</option>
              <option value={600}>600</option>
              <option value={700}>700</option>
              <option value={800}>800</option>
            </select>
          </Field>
          <Field label="Style">
            <select value={style?.font_style ?? ''}
              onChange={(e) => upd({ font_style: e.target.value === '' ? undefined : (e.target.value as 'normal' | 'italic') })}
              className={inputCls}>
              <option value="">—</option>
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </select>
          </Field>
          <Field label="Align">
            <select value={style?.align ?? ''}
              onChange={(e) => upd({ align: e.target.value === '' ? undefined : (e.target.value as BlockStyle['align']) })}
              className={inputCls}>
              <option value="">—</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </Field>
          <Field label="Transform">
            <select value={style?.text_transform ?? ''}
              onChange={(e) => upd({ text_transform: e.target.value === '' ? undefined : (e.target.value as BlockStyle['text_transform']) })}
              className={inputCls}>
              <option value="">—</option>
              <option value="none">None</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-2">
        <Label>Colors</Label>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Text" value={style?.color ?? ''}
            onChange={(v) => upd({ color: v || undefined })} />
          <ColorField label="Background" value={style?.background ?? ''}
            onChange={(v) => upd({ background: v || undefined })} />
        </div>
      </div>

      {/* Spacing */}
      <div className="space-y-2">
        <Label>Padding</Label>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Top">    <input type="text" value={pad.top ?? ''}    onChange={(e) => updPad('top',    e.target.value)} className={inputCls} placeholder="0" /></Field>
          <Field label="Right">  <input type="text" value={pad.right ?? ''}  onChange={(e) => updPad('right',  e.target.value)} className={inputCls} placeholder="0" /></Field>
          <Field label="Bottom"> <input type="text" value={pad.bottom ?? ''} onChange={(e) => updPad('bottom', e.target.value)} className={inputCls} placeholder="0" /></Field>
          <Field label="Left">   <input type="text" value={pad.left ?? ''}   onChange={(e) => updPad('left',   e.target.value)} className={inputCls} placeholder="0" /></Field>
        </div>
        {padShort && (
          <p className="text-[10px] text-amber-600">Currently set as shorthand: <code>{padShort}</code> — type per-side values to override.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Margin</Label>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Top">    <input type="text" value={mar.top ?? ''}    onChange={(e) => updMar('top',    e.target.value)} className={inputCls} placeholder="0" /></Field>
          <Field label="Right">  <input type="text" value={mar.right ?? ''}  onChange={(e) => updMar('right',  e.target.value)} className={inputCls} placeholder="0" /></Field>
          <Field label="Bottom"> <input type="text" value={mar.bottom ?? ''} onChange={(e) => updMar('bottom', e.target.value)} className={inputCls} placeholder="0" /></Field>
          <Field label="Left">   <input type="text" value={mar.left ?? ''}   onChange={(e) => updMar('left',   e.target.value)} className={inputCls} placeholder="0" /></Field>
        </div>
        {marShort && (
          <p className="text-[10px] text-amber-600">Currently set as shorthand: <code>{marShort}</code></p>
        )}
      </div>

      {/* Box */}
      <div className="space-y-2">
        <Label>Box</Label>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width">
            <input type="text" value={style?.width ?? ''}
              onChange={(e) => upd({ width: e.target.value || undefined })}
              className={inputCls} placeholder="100% / 120mm" />
          </Field>
          <Field label="Border">
            <input type="text" value={style?.border ?? ''}
              onChange={(e) => upd({ border: e.target.value || undefined })}
              className={inputCls} placeholder="1px solid #cbd5e1" />
          </Field>
          <Field label="Radius">
            <input type="text" value={style?.border_radius ?? ''}
              onChange={(e) => upd({ border_radius: e.target.value || undefined })}
              className={inputCls} placeholder="6px" />
          </Field>
          <Field label="Line height">
            <input type="text" value={style?.line_height as string | number | undefined ?? ''}
              onChange={(e) => upd({ line_height: e.target.value || undefined })}
              className={inputCls} placeholder="1.4" />
          </Field>
        </div>
      </div>

      {(style && Object.keys(style).length > 0) && (
        <div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[11px] text-rose-600 hover:text-rose-700 underline"
          >
            Reset block style
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Shared form atoms ─────────────────────────────────────────────────

const inputCls =
  'w-full h-7 px-2 rounded border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500';

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{children}</label>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] text-slate-500 mb-0.5">{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 border-t border-slate-200 first:border-0 first:pt-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">{label}</span>
      <span className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-1">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 p-0 rounded border border-slate-200 cursor-pointer shrink-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className={inputCls} placeholder="#0ea5e9 / transparent" />
      </div>
    </Field>
  );
}
