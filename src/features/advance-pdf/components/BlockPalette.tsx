'use client';

import type { BlockType } from '@/lib/pdf-v2-types';
import { BLOCK_META, PALETTE_ORDER, blocksByCategory } from '../utils/block-meta';

/**
 * Click-to-insert palette. The editor passes the active "insert
 * target" (region: header/body/footer, plus the parent path of the
 * currently-selected container if any). Each tile triggers
 * `onInsert(type)` which the editor handles by appending a new block
 * to the right place.
 *
 * Drag-to-canvas can come later — click-to-insert is faster to ship
 * and doesn't need a DnD library.
 */

interface Props {
  onInsert: (type: BlockType) => void;
  hint?:    string;
}

export function BlockPalette({ onInsert, hint }: Props) {
  const grouped = blocksByCategory();
  return (
    <div className="space-y-3">
      {hint && <p className="text-[11px] text-slate-500 italic px-1">{hint}</p>}
      {PALETTE_ORDER.map((cat) => (
        <div key={cat}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-1.5">{cat}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {grouped[cat].map((type) => (
              <PaletteTile key={type} type={type} onInsert={onInsert} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaletteTile({ type, onInsert }: { type: BlockType; onInsert: (t: BlockType) => void }) {
  const meta = BLOCK_META[type];
  return (
    <button
      type="button"
      onClick={() => onInsert(type)}
      title={meta.description}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-300 text-[11px] text-slate-700 hover:text-sky-700 transition-colors"
    >
      <svg className="w-3.5 h-3.5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
      </svg>
      <span className="truncate">{meta.label}</span>
    </button>
  );
}
