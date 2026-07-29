'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AdvanceContextType } from '@/lib/pdf-v2-types';
import { tokenCatalogFor, type TokenSuggestion } from '../utils/token-catalog';

/**
 * Input with click-to-insert token suggestions.
 *
 * Drops a small dropdown beneath the field that lists every token in
 * the context catalog. The user can either type the token themselves
 * or click a suggestion — clicking inserts `{token.path}` at the
 * cursor (or replaces the partial `{prefix}` the user just started
 * typing).
 *
 * Filter logic:
 *   - if the cursor is inside an unclosed `{…` the dropdown filters by
 *     the partial token (substring match on `path`)
 *   - otherwise the full catalog shows when focused
 *
 * `multiline` switches between `<input>` and `<textarea>`. The render
 * stays purely controlled — parent owns the value.
 */
export function TokenAutocomplete({
  value,
  onChange,
  contextType,
  multiline,
  rows = 3,
  placeholder,
  className,
}: {
  value:       string;
  onChange:    (v: string) => void;
  contextType: AdvanceContextType;
  multiline?:  boolean;
  rows?:       number;
  placeholder?: string;
  className?:  string;
}) {
  const inputRef    = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const wrapRef     = useRef<HTMLDivElement | null>(null);
  const [open,        setOpen]        = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const catalog = useMemo(() => tokenCatalogFor(contextType), [contextType]);

  // What the user is typing inside an unclosed `{…`. `null` if the
  // cursor isn't inside an open token.
  const partial = useMemo(() => {
    const el = inputRef.current;
    if (!el) return null;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const lastOpen  = before.lastIndexOf('{');
    const lastClose = before.lastIndexOf('}');
    if (lastOpen === -1 || lastOpen < lastClose) return null;
    return before.slice(lastOpen + 1);
  }, [value]);

  const suggestions = useMemo(() => {
    if (partial == null) return catalog;
    const needle = partial.trim().toLowerCase();
    if (!needle) return catalog;
    return catalog.filter((s) => s.path.toLowerCase().includes(needle));
  }, [catalog, partial]);

  // Outside-click closes the dropdown.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const insertToken = (s: TokenSuggestion) => {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const after  = value.slice(caret);
    let next: string;
    let nextCaret: number;
    if (partial != null) {
      // Replace the in-progress `{partial` with `{path}` so we don't
      // double-up the brace.
      const lastOpen = before.lastIndexOf('{');
      const head = before.slice(0, lastOpen);
      next = `${head}{${s.path}}${after}`;
      nextCaret = head.length + s.path.length + 2;
    } else {
      next = `${before}{${s.path}}${after}`;
      nextCaret = before.length + s.path.length + 2;
    }
    onChange(next);
    setOpen(false);
    // Restore caret position after React updates the input.
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && partial != null && suggestions[activeIndex]) {
      e.preventDefault();
      insertToken(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Reset active index when the suggestion list shape changes.
  useEffect(() => { setActiveIndex(0); }, [partial]);

  const inputCls =
    className ??
    'w-full h-7 px-2 rounded border border-slate-200 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-sky-500';

  return (
    <div ref={wrapRef} className="relative">
      {multiline ? (
        <textarea
          ref={(el) => { inputRef.current = el; }}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 rounded border border-slate-200 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      ) : (
        <input
          ref={(el) => { inputRef.current = el; }}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={inputCls}
        />
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto text-[11px]">
          {suggestions.slice(0, 50).map((s, i) => (
            <button
              key={s.path}
              type="button"
              onClick={() => insertToken(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left px-2 py-1.5 flex items-center justify-between gap-2 ${
                i === activeIndex ? 'bg-sky-50' : 'hover:bg-slate-50'
              }`}
            >
              <span className="font-mono text-slate-800 truncate">{`{${s.path}}`}</span>
              <span className="text-[10px] text-slate-400 truncate flex-shrink-0 max-w-[50%]">{s.description}</span>
            </button>
          ))}
          {suggestions.length > 50 && (
            <p className="px-2 py-1.5 text-[10px] text-slate-400 italic">… and {suggestions.length - 50} more — keep typing to narrow</p>
          )}
        </div>
      )}
    </div>
  );
}
