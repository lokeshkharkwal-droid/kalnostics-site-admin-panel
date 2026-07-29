'use client';

/**
 * Hierarchical view of the document, with @dnd-kit-powered
 * drag-to-reorder. A single top-level DndContext owns every
 * `blocks: Block[]` array in the tree, keyed by parent path. That lets
 * a drag start in one array and drop into a different one — the body,
 * a column inside a `columns` block, or the children of a `section`.
 *
 * Each row's sortable id encodes its parent path:
 *   `<parentPath joined with .>::<block.id>`
 * which the drag-end handler decodes to figure out what to do:
 *   - same parent path on both ends → onReorder (vertical reorder)
 *   - different parent paths        → onMoveAcross (cross-array drop)
 *
 * Empty arrays still register as a droppable so the user can drag the
 * first block into them.
 *
 * Drag handle is a small ⠿ icon to the left of each row so the whole
 * label area stays clickable for selection.
 */

import { useMemo, useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Block, DocPath } from '@/lib/pdf-v2-types';
import { BLOCK_META } from '../utils/block-meta';
import { blockChildArrayPaths, pathsEqual } from '../utils/document-ops';

interface Props {
  blocks: {
    header: Block[];
    body:   Block[];
    footer: Block[];
  };
  selectedPath: DocPath | null;
  onSelect:     (path: DocPath) => void;
  onMove:       (parentPath: DocPath, index: number, delta: -1 | 1) => void;
  onDuplicate:  (parentPath: DocPath, index: number) => void;
  onDelete:     (parentPath: DocPath, index: number) => void;
  onReorder:    (parentPath: DocPath, fromIndex: number, toIndex: number) => void;
  /** Cross-array move: dragged from one parent path into another. */
  onMoveAcross: (fromParent: DocPath, fromIndex: number, toParent: DocPath, toIndex: number) => void;
}

const EMPTY_SUFFIX = '__empty__';

function encodeParentPath(p: DocPath): string {
  return p.join('.');
}
function decodeParentPath(s: string): DocPath {
  if (!s) return [];
  return s.split('.').map((seg) => /^\d+$/.test(seg) ? Number(seg) : seg);
}
function parseSortableId(id: string): { parentPath: DocPath; tail: string } {
  const idx = id.lastIndexOf('::');
  if (idx < 0) return { parentPath: [], tail: id };
  return {
    parentPath: decodeParentPath(id.slice(0, idx)),
    tail:       id.slice(idx + 2),
  };
}

export function BlockTree(props: Props) {
  const regions = useMemo(() => ([
    { label: 'Header', parent: ['header', 'blocks'] as DocPath, blocks: props.blocks.header },
    { label: 'Body',   parent: ['body',   'blocks'] as DocPath, blocks: props.blocks.body   },
    { label: 'Footer', parent: ['footer', 'blocks'] as DocPath, blocks: props.blocks.footer },
  ]), [props.blocks]);

  // 6px activation distance so a click doesn't accidentally start a
  // drag — keeps single-row clicks routing into onSelect.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.active || !e.over) return;
    const fromId = String(e.active.id);
    const overId = String(e.over.id);
    if (fromId === overId) return;

    const from = parseSortableId(fromId);
    const over = parseSortableId(overId);

    // Resolve from index by locating the block id inside the source
    // array. Same approach for `to` — except the target may be an empty
    // sentinel, in which case we land at index 0.
    const fromArr = readArrayAtPath(props.blocks, from.parentPath);
    const fromIndex = fromArr ? fromArr.findIndex((b) => b.id === from.tail) : -1;
    if (fromIndex < 0) return;

    let toIndex: number;
    if (over.tail === EMPTY_SUFFIX) {
      toIndex = 0;
    } else {
      const toArr = readArrayAtPath(props.blocks, over.parentPath);
      if (!toArr) return;
      const idx = toArr.findIndex((b) => b.id === over.tail);
      if (idx < 0) return;
      toIndex = idx;
    }

    if (pathsEqual(from.parentPath, over.parentPath)) {
      if (fromIndex === toIndex) return;
      props.onReorder(from.parentPath, fromIndex, toIndex);
    } else {
      props.onMoveAcross(from.parentPath, fromIndex, over.parentPath, toIndex);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        {regions.map((r) => (
          <div key={r.label}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-1">{r.label}</div>
            <SortableArray
              parentPath={r.parent}
              blocks={r.blocks}
              depth={0}
              selectedPath={props.selectedPath}
              onSelect={props.onSelect}
              onMove={props.onMove}
              onDuplicate={props.onDuplicate}
              onDelete={props.onDelete}
            />
          </div>
        ))}
      </div>
    </DndContext>
  );
}

// ─── Sortable container for a single blocks: Block[] array ──────────

function SortableArray({
  parentPath, blocks, depth,
  selectedPath, onSelect, onMove, onDuplicate, onDelete,
}: {
  parentPath: DocPath;
  blocks:     Block[];
  depth:      number;
} & Pick<Props, 'selectedPath' | 'onSelect' | 'onMove' | 'onDuplicate' | 'onDelete'>) {
  const idFor = (block: Block) => `${encodeParentPath(parentPath)}::${block.id}`;
  const items = blocks.map(idFor);

  if (blocks.length === 0) {
    return <EmptyDroppable parentPath={parentPath} depth={depth} />;
  }

  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <ul className="space-y-px">
        {blocks.map((b, i) => (
          <BlockRow
            key={b.id}
            sortableId={idFor(b)}
            block={b}
            parentPath={parentPath}
            index={i}
            parentLength={blocks.length}
            depth={depth}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onMove={onMove}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </SortableContext>
  );
}

function EmptyDroppable({ parentPath, depth }: { parentPath: DocPath; depth: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${encodeParentPath(parentPath)}::${EMPTY_SUFFIX}`,
  });
  return (
    <div
      ref={setNodeRef}
      className={`text-[11px] italic rounded px-1 py-1 transition-colors ${
        isOver ? 'bg-sky-100 text-sky-700' : 'text-slate-400'
      }`}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      Empty {isOver ? '— drop to add' : ''}
    </div>
  );
}

// ─── A single row ───────────────────────────────────────────────────

function BlockRow({
  sortableId, block, parentPath, index, parentLength, depth,
  selectedPath, onSelect, onMove, onDuplicate, onDelete,
}: {
  sortableId:   string;
  block:        Block;
  parentPath:   DocPath;
  index:        number;
  parentLength: number;
  depth:        number;
} & Pick<Props, 'selectedPath' | 'onSelect' | 'onMove' | 'onDuplicate' | 'onDelete'>) {
  const meta = BLOCK_META[block.type];
  const path: DocPath = [...parentPath, index];
  const selected = selectedPath ? pathsEqual(selectedPath, path) : false;
  const [open, setOpen] = useState(true);
  const childPaths = meta.isContainer ? blockChildArrayPaths(block) : [];

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: sortableId });
  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={dragStyle}>
      <div
        className={`group flex items-center gap-1 rounded px-2 py-1.5 cursor-pointer text-xs transition-colors ${
          selected ? 'bg-sky-100 text-sky-900' : 'hover:bg-slate-100 text-slate-700'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={() => onSelect(path)}
      >
        {/* Drag handle — only this element accepts drag listeners so
             clicking elsewhere on the row still selects. */}
        <span
          {...attributes} {...listeners}
          className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing select-none w-3 shrink-0 leading-none"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >⠿</span>

        {meta.isContainer && childPaths.length > 0 ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            className="text-slate-400 hover:text-slate-600 w-3 shrink-0"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <svg className="w-3.5 h-3.5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
        </svg>
        <span className="flex-1 truncate">{meta.label}</span>
        <RowActions
          parentPath={parentPath}
          index={index}
          parentLength={parentLength}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
      {meta.isContainer && open && childPaths.length > 0 && (
        <ul className="space-y-px">
          {childPaths.map((cp) => {
            const childArr = (() => {
              let node: unknown = block;
              for (const seg of cp) node = (node as Record<string | number, unknown>)[seg];
              return Array.isArray(node) ? (node as Block[]) : [];
            })();
            const fullParent: DocPath = [...path, ...cp];
            const groupLabel = block.type === 'columns'
              ? `Column ${(cp[2] as number) + 1}`
              : '';
            return (
              <li key={JSON.stringify(cp)}>
                {groupLabel && (
                  <div
                    className="text-[10px] font-medium uppercase tracking-widest text-slate-400 px-1 mt-1"
                    style={{ paddingLeft: `${8 + (depth + 1) * 12}px` }}
                  >
                    {groupLabel}
                  </div>
                )}
                <SortableArray
                  parentPath={fullParent}
                  blocks={childArr}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  onMove={onMove}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function RowActions({
  parentPath, index, parentLength, onMove, onDuplicate, onDelete,
}: {
  parentPath:   DocPath;
  index:        number;
  parentLength: number;
  onMove:       (parentPath: DocPath, index: number, delta: -1 | 1) => void;
  onDuplicate:  (parentPath: DocPath, index: number) => void;
  onDelete:     (parentPath: DocPath, index: number) => void;
}) {
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  return (
    <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-slate-400">
      <button
        type="button" title="Move up" disabled={index === 0}
        className="hover:text-sky-600 disabled:opacity-30 disabled:hover:text-slate-400 w-5 h-5 flex items-center justify-center"
        onClick={stop(() => onMove(parentPath, index, -1))}
      >↑</button>
      <button
        type="button" title="Move down" disabled={index >= parentLength - 1}
        className="hover:text-sky-600 disabled:opacity-30 disabled:hover:text-slate-400 w-5 h-5 flex items-center justify-center"
        onClick={stop(() => onMove(parentPath, index, +1))}
      >↓</button>
      <button
        type="button" title="Duplicate"
        className="hover:text-sky-600 w-5 h-5 flex items-center justify-center"
        onClick={stop(() => onDuplicate(parentPath, index))}
      >⎘</button>
      <button
        type="button" title="Delete"
        className="hover:text-rose-600 w-5 h-5 flex items-center justify-center"
        onClick={stop(() => onDelete(parentPath, index))}
      >×</button>
    </span>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Resolve a parent path against the {header, body, footer} blob the
 * tree was rendered from. Walks the path one segment at a time so the
 * caller can hand any nested array path (e.g. body.blocks.0.props.blocks).
 */
function readArrayAtPath(
  rootBlocks: Props['blocks'],
  path: DocPath,
): Block[] | null {
  if (path.length === 0) return null;
  const head = path[0];
  let node: unknown;
  if (head === 'header')      node = { blocks: rootBlocks.header };
  else if (head === 'body')   node = { blocks: rootBlocks.body };
  else if (head === 'footer') node = { blocks: rootBlocks.footer };
  else return null;
  for (let i = 1; i < path.length; i++) {
    if (node == null) return null;
    node = (node as Record<string | number, unknown>)[path[i]];
  }
  return Array.isArray(node) ? (node as Block[]) : null;
}
