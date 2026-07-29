/**
 * Best-effort HTML → AdvanceDocument-blocks importer.
 *
 * Scope: enough to migrate legacy `pdf_template.meta` HTML bodies and
 * to let users paste from another visual builder. Pure, deterministic,
 * runs in the browser via `DOMParser` — no API.
 *
 * Mapping rules:
 *   <h1..h4>      → heading
 *   <p>           → paragraph
 *   <span/strong/em/b/i/u/small> at the top level → paragraph
 *                   (inline weight/italic transferred to BlockStyle)
 *   <hr>          → divider
 *   <img>         → image
 *   <table>       → table (header row + body rows as inline rows)
 *   <ul>/<ol>     → paragraph with bullet/number prefixes (no list block yet)
 *   <div display:flex> with ≥ 2 children → columns
 *   <div>/<section>/<article> → section (or hoisted children when no style)
 *   anything else → paragraph of textContent + warning
 *
 * Inline `style="…"` is parsed into BlockStyle. Tokens like
 * `{patient.full_name}` are preserved verbatim in text props because
 * we always use `textContent` (which doesn't escape braces).
 *
 * Limits worth knowing:
 *   - inline emphasis inside a paragraph is flattened (we only carry
 *     paragraph-level style — no rich-text spans within a single block)
 *   - CSS units that aren't pt are taken numerically (16px → 16pt) —
 *     deliberately lossy; user fixes in the property panel
 *   - <script>, <style>, <iframe> are silently dropped (security)
 */

import type { Block, BlockStyle } from '@/lib/pdf-v2-types';
import { newId } from './document-ops';

export interface HtmlImportResult {
  blocks:   Block[];
  warnings: string[];
}

const SKIP_TAGS = new Set(['script', 'style', 'iframe', 'noscript', 'meta', 'link']);

export function importHtml(html: string): HtmlImportResult {
  const warnings: string[] = [];
  const blocks: Block[] = [];
  // text/html wraps fragments in <html><body>… so this works for both
  // partial snippets and full documents.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const child of Array.from(doc.body.childNodes)) {
    blocks.push(...nodeToBlocks(child, warnings));
  }
  return { blocks, warnings: dedupe(warnings) };
}

// ─── Node walker ────────────────────────────────────────────────────────

function nodeToBlocks(node: Node, warnings: string[]): Block[] {
  // Text nodes — only emit when there's something to show.
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return [];
    return [{ id: newId(), type: 'paragraph', props: { text } }];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el  = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return [];

  const styleStr = el.getAttribute('style') ?? '';
  const style    = parseStyle(styleStr);

  switch (tag) {
    case 'h1': case 'h2': case 'h3': case 'h4': {
      const level = Number(tag[1]) as 1 | 2 | 3 | 4;
      const text  = (el.textContent ?? '').trim();
      const block: Block = { id: newId(), type: 'heading', props: { level, text } };
      if (style) block.style = style;
      return [block];
    }
    case 'h5': case 'h6': {
      // Coerce H5/H6 → H4 (closest supported level).
      warnings.push(`<${tag}> coerced to <h4>.`);
      const text = (el.textContent ?? '').trim();
      const block: Block = { id: newId(), type: 'heading', props: { level: 4, text } };
      if (style) block.style = style;
      return [block];
    }

    case 'p': {
      const text = collapseWhitespace(el.textContent ?? '');
      if (!text.trim()) return [];
      const block: Block = { id: newId(), type: 'paragraph', props: { text } };
      if (style) block.style = style;
      return [block];
    }

    case 'span': case 'strong': case 'em': case 'b': case 'i': case 'u': case 'small': {
      const text = collapseWhitespace(el.textContent ?? '');
      if (!text.trim()) return [];
      const inline: BlockStyle = { ...(style ?? {}) };
      if (tag === 'strong' || tag === 'b') inline.font_weight = 'bold';
      if (tag === 'em' || tag === 'i')     inline.font_style  = 'italic';
      const block: Block = { id: newId(), type: 'paragraph', props: { text } };
      if (Object.keys(inline).length > 0) block.style = inline;
      return [block];
    }

    case 'br':  return [];
    case 'hr': {
      const block: Block = { id: newId(), type: 'divider', props: {} };
      if (style) block.style = style;
      return [block];
    }

    case 'img': {
      const src    = el.getAttribute('src') ?? '';
      const alt    = el.getAttribute('alt') ?? undefined;
      const widthA = el.getAttribute('width');
      const heightA = el.getAttribute('height');
      const width  = widthA  ? withPx(widthA)  : style?.width;
      const height = heightA ? withPx(heightA) : undefined;
      const block: Block = {
        id: newId(), type: 'image',
        props: { src, ...(alt ? { alt } : {}), ...(width ? { width } : {}), ...(height ? { height } : {}) },
      };
      // The width prop is the source of truth for sizing — drop the
      // duplicate from style so it doesn't double-apply.
      if (style) {
        const { width: _w, ...rest } = style;
        if (Object.keys(rest).length > 0) block.style = rest as BlockStyle;
      }
      return [block];
    }

    case 'table': {
      return [parseTable(el as HTMLTableElement, style)];
    }

    case 'ul': case 'ol': {
      const items = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === 'li');
      if (items.length === 0) return [];
      const lines = items.map((li, i) => {
        const prefix = tag === 'ul' ? '• ' : `${i + 1}. `;
        return prefix + collapseWhitespace(li.textContent ?? '');
      });
      const block: Block = { id: newId(), type: 'paragraph', props: { text: lines.join('\n') } };
      if (style) block.style = style;
      return [block];
    }

    case 'div': case 'section': case 'article': case 'header': case 'footer': case 'main':
    case 'aside': case 'nav': {
      // Columns detection: flex container with ≥ 2 element children.
      const isFlex = /display\s*:\s*flex/i.test(styleStr);
      const elementChildren = Array.from(el.children);
      if (isFlex && elementChildren.length >= 2) {
        const columns = elementChildren.map((c) => {
          const cs    = c.getAttribute('style') ?? '';
          const cw    = pickWidth(cs);
          const inner = childrenToBlocks(c, warnings);
          return cw ? { width: cw, blocks: inner } : { blocks: inner };
        });
        const gap = pickGap(styleStr) ?? '12px';
        const block: Block = {
          id: newId(), type: 'columns',
          props: { columns, gap },
        };
        if (style) block.style = style;
        return [block];
      }

      const inner = childrenToBlocks(el, warnings);
      // Hoist the children when there's no style worth preserving —
      // avoids littering the doc with empty <section> wrappers.
      if (!style || Object.keys(style).length === 0) return inner;
      const block: Block = { id: newId(), type: 'section', props: { blocks: inner }, style };
      return [block];
    }

    default: {
      const text = collapseWhitespace(el.textContent ?? '');
      if (!text.trim()) return [];
      warnings.push(`<${tag}> isn't supported — kept text as a paragraph.`);
      const block: Block = { id: newId(), type: 'paragraph', props: { text } };
      if (style) block.style = style;
      return [block];
    }
  }
}

function childrenToBlocks(el: Element, warnings: string[]): Block[] {
  const out: Block[] = [];
  for (const child of Array.from(el.childNodes)) out.push(...nodeToBlocks(child, warnings));
  return out;
}

// ─── Table parser ───────────────────────────────────────────────────────

function parseTable(el: HTMLTableElement, style: BlockStyle | undefined): Block {
  const cols: Array<{ key: string; label: string; width?: string }> = [];

  // Header: prefer thead > tr; fall back to first tr in the table.
  const headRow =
    el.querySelector('thead tr') ??
    (el.querySelector('tr')?.querySelector('th') ? el.querySelector('tr') : null);
  const headerCells = headRow ? Array.from(headRow.children) : [];
  for (const cell of headerCells) {
    const label = collapseWhitespace(cell.textContent ?? '');
    const width = pickWidth(cell.getAttribute('style') ?? '') ?? cell.getAttribute('width') ?? undefined;
    cols.push({
      key:   slug(label) || `c${cols.length + 1}`,
      label: label || `Column ${cols.length + 1}`,
      ...(width ? { width: withPx(width) } : {}),
    });
  }

  // Body rows.
  const bodyTr = el.querySelector('tbody')
    ? Array.from(el.querySelectorAll('tbody tr'))
    : Array.from(el.querySelectorAll('tr')).filter((r) => r !== headRow);

  // Infer columns from the first body row if no header was found.
  if (cols.length === 0 && bodyTr[0]) {
    Array.from(bodyTr[0].children).forEach((_, i) => {
      cols.push({ key: `c${i + 1}`, label: `Column ${i + 1}` });
    });
  }

  const rows: Array<Record<string, string>> = [];
  for (const tr of bodyTr) {
    const cells = Array.from(tr.children);
    const row: Record<string, string> = {};
    cells.forEach((cell, i) => {
      const key = cols[i]?.key ?? `c${i + 1}`;
      row[key] = collapseWhitespace(cell.textContent ?? '');
    });
    rows.push(row);
  }

  const block: Block = {
    id: newId(), type: 'table',
    props: {
      columns: cols.length > 0 ? cols : [{ key: 'c1', label: 'Column 1' }],
      rows,
      striped: false,
    },
  };
  if (style) block.style = style;
  return block;
}

// ─── Inline style → BlockStyle ──────────────────────────────────────────

function parseStyle(s: string): BlockStyle | undefined {
  if (!s) return undefined;
  const map = new Map<string, string>();
  for (const part of s.split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    map.set(part.slice(0, i).trim().toLowerCase(), part.slice(i + 1).trim());
  }
  const out: BlockStyle = {};

  if (map.has('font-family'))     out.font_family     = stripQuotes(map.get('font-family')!);
  if (map.has('color'))           out.color           = map.get('color');
  if (map.has('background'))      out.background      = map.get('background');
  if (map.has('background-color')) out.background     = map.get('background-color');
  if (map.has('letter-spacing'))  out.letter_spacing  = map.get('letter-spacing');
  if (map.has('width'))           out.width           = map.get('width');
  if (map.has('border'))          out.border          = map.get('border');
  if (map.has('border-radius'))   out.border_radius   = map.get('border-radius');

  if (map.has('font-size')) {
    const v = map.get('font-size')!;
    const n = parseFloat(v);
    if (Number.isFinite(n)) out.font_size = n;
  }

  if (map.has('font-weight')) {
    const v = map.get('font-weight')!;
    const n = Number(v);
    if (Number.isFinite(n)) out.font_weight = n;
    else if (v === 'bold' || v === 'normal') out.font_weight = v;
  }

  if (map.has('font-style')) {
    const v = map.get('font-style')!;
    if (v === 'italic' || v === 'normal') out.font_style = v;
  }

  if (map.has('text-align')) {
    const v = map.get('text-align')!;
    if (v === 'left' || v === 'center' || v === 'right' || v === 'justify') out.align = v;
  }

  if (map.has('text-transform')) {
    const v = map.get('text-transform')!;
    if (v === 'none' || v === 'uppercase' || v === 'lowercase' || v === 'capitalize') out.text_transform = v;
  }

  if (map.has('line-height')) {
    const v = map.get('line-height')!;
    const n = Number(v);
    out.line_height = Number.isFinite(n) ? n : v;
  }

  if (map.has('padding')) out.padding = map.get('padding');
  if (map.has('margin'))  out.margin  = map.get('margin');

  return Object.keys(out).length > 0 ? out : undefined;
}

// ─── Tiny helpers ───────────────────────────────────────────────────────

function pickWidth(s: string): string | undefined {
  const m = /(?:^|;)\s*width\s*:\s*([^;]+)/i.exec(s);
  return m ? m[1].trim() : undefined;
}
function pickGap(s: string): string | undefined {
  const m = /(?:^|;)\s*gap\s*:\s*([^;]+)/i.exec(s);
  return m ? m[1].trim() : undefined;
}
function withPx(v: string): string {
  // Bare number → assume px (common in HTML width="120" attributes).
  return /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
}
function stripQuotes(s: string): string {
  return s.replace(/^['"]|['"]$/g, '');
}
function collapseWhitespace(s: string): string {
  return s.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24);
}
function dedupe(xs: string[]): string[] {
  return [...new Set(xs)];
}
