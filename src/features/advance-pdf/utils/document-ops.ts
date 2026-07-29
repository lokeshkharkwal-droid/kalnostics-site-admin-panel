/**
 * Immutable document operations for the Advance PDF editor.
 *
 * Every operation returns a deep-cloned document — React state stays
 * referentially stable for components that only re-render on identity
 * changes (PreviewFrame, BlockTree).
 *
 * `DocPath` is a sequence of object-keys and array-indices that
 * navigate into the AdvanceDocument. The "last" segment of every path
 * we care about is always the array index of a block inside its parent
 * `blocks: Block[]` array. Helpers below accept a parent path (the
 * Block[] array) plus the index, OR a full path to a block.
 */

import type { AdvanceDocument, Block, DocPath } from '@/lib/pdf-v2-types';

/** Deep clone via JSON round-trip — fine for plain JSON-serializable docs. */
export function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }

/** Read a node at the given path, or undefined if any segment is missing. */
export function readPath(doc: AdvanceDocument, path: DocPath): unknown {
  let node: unknown = doc;
  for (const seg of path) {
    if (node == null) return undefined;
    node = (node as Record<string | number, unknown>)[seg];
  }
  return node;
}

/** Replace the node at `path` with `value`. Returns a new doc. */
export function setPath(doc: AdvanceDocument, path: DocPath, value: unknown): AdvanceDocument {
  if (path.length === 0) return value as AdvanceDocument;
  const next = clone(doc);
  let parent: Record<string | number, unknown> = next as unknown as Record<string | number, unknown>;
  for (let i = 0; i < path.length - 1; i++) {
    parent = parent[path[i]] as Record<string | number, unknown>;
  }
  parent[path[path.length - 1]] = value;
  return next;
}

/** Update the node at `path` via a producer function. */
export function updatePath<T>(doc: AdvanceDocument, path: DocPath, updater: (cur: T) => T): AdvanceDocument {
  const cur = readPath(doc, path) as T;
  return setPath(doc, path, updater(cur));
}

// ─── Block container helpers ────────────────────────────────────────────

/**
 * Lists every "blocks array" path inside a block. Returns the path
 * relative to the block (e.g. ['props', 'blocks'] for section,
 * ['props', 'columns', 0, 'blocks'] for the first column).
 *
 * Used by the recursive tree walker and validators.
 */
export function blockChildArrayPaths(b: Block): DocPath[] {
  switch (b.type) {
    case 'section':
    case 'repeat':
    case 'conditional':
      return [['props', 'blocks']];
    case 'columns':
      return b.props.columns.map((_, i) => ['props', 'columns', i, 'blocks']);
    default:
      return [];
  }
}

/** Insert a block into a `blocks: Block[]` array at the given index. */
export function insertBlock(doc: AdvanceDocument, parentPath: DocPath, index: number, block: Block): AdvanceDocument {
  return updatePath<Block[]>(doc, parentPath, (arr) => {
    const safe = Array.isArray(arr) ? arr : [];
    const out = safe.slice();
    const at = Math.max(0, Math.min(index, out.length));
    out.splice(at, 0, block);
    return out;
  });
}

/** Append a block to a `blocks: Block[]` array. */
export function appendBlock(doc: AdvanceDocument, parentPath: DocPath, block: Block): AdvanceDocument {
  return updatePath<Block[]>(doc, parentPath, (arr) => {
    const safe = Array.isArray(arr) ? arr : [];
    return [...safe, block];
  });
}

/** Remove the block at the given index from a `blocks: Block[]` array. */
export function removeBlockAt(doc: AdvanceDocument, parentPath: DocPath, index: number): AdvanceDocument {
  return updatePath<Block[]>(doc, parentPath, (arr) => {
    const safe = Array.isArray(arr) ? arr : [];
    const out = safe.slice();
    out.splice(index, 1);
    return out;
  });
}

/**
 * Move a block by `delta` (+1 / -1) inside its parent array.
 * No-op when the move would go out of bounds.
 */
export function moveBlock(doc: AdvanceDocument, parentPath: DocPath, index: number, delta: -1 | 1): AdvanceDocument {
  return updatePath<Block[]>(doc, parentPath, (arr) => {
    const safe = Array.isArray(arr) ? arr : [];
    const target = index + delta;
    if (target < 0 || target >= safe.length) return safe;
    const out = safe.slice();
    const [moved] = out.splice(index, 1);
    out.splice(target, 0, moved);
    return out;
  });
}

/**
 * Reorder a block from `fromIndex` to `toIndex` inside its parent
 * array. Used by the @dnd-kit handler — drag-and-drop yields absolute
 * indices, not deltas. No-op when either index is invalid.
 */
export function reorderBlocks(doc: AdvanceDocument, parentPath: DocPath, fromIndex: number, toIndex: number): AdvanceDocument {
  return updatePath<Block[]>(doc, parentPath, (arr) => {
    const safe = Array.isArray(arr) ? arr : [];
    if (fromIndex === toIndex) return safe;
    if (fromIndex < 0 || fromIndex >= safe.length) return safe;
    if (toIndex   < 0 || toIndex   >= safe.length) return safe;
    const out = safe.slice();
    const [moved] = out.splice(fromIndex, 1);
    out.splice(toIndex, 0, moved);
    return out;
  });
}

/**
 * Move a block from one `blocks: Block[]` array into another. Used by
 * cross-array drag-drop in the tree (e.g. dragging a block out of a
 * column into the body, or into a sibling section).
 *
 * Returns the original doc unchanged when:
 *   - source array doesn't exist or fromIndex is out of bounds
 *   - the source block is an ancestor of the target path (would create
 *     a cycle — illegal drop)
 *
 * When source and target are the same array, the call is forwarded to
 * `reorderBlocks` so callers don't have to special-case it.
 */
export function moveBlockAcross(
  doc: AdvanceDocument,
  fromParent: DocPath, fromIndex: number,
  toParent:   DocPath, toIndex:   number,
): AdvanceDocument {
  if (pathsEqual(fromParent, toParent)) {
    return reorderBlocks(doc, fromParent, fromIndex, toIndex);
  }
  const next = clone(doc);
  const fromArr = readPath(next, fromParent) as Block[];
  if (!Array.isArray(fromArr) || fromIndex < 0 || fromIndex >= fromArr.length) return doc;
  const [moved] = fromArr.splice(fromIndex, 1);

  // If `toParent` traverses the source array, the removal at fromIndex
  // shifted any later sibling. Either rewrite the next index segment
  // down by one, OR (if toParent traversed THROUGH fromIndex) reject
  // the drop — that would be moving a block into one of its descendants.
  let adjustedTarget: DocPath = toParent;
  if (toParent.length > fromParent.length) {
    let prefixMatches = true;
    for (let i = 0; i < fromParent.length; i++) {
      if (toParent[i] !== fromParent[i]) { prefixMatches = false; break; }
    }
    if (prefixMatches) {
      const seg = toParent[fromParent.length];
      if (typeof seg === 'number') {
        if (seg === fromIndex) return doc;
        if (seg > fromIndex) {
          adjustedTarget = [
            ...toParent.slice(0, fromParent.length),
            seg - 1,
            ...toParent.slice(fromParent.length + 1),
          ];
        }
      }
    }
  }
  const toArr = readPath(next, adjustedTarget) as Block[];
  if (!Array.isArray(toArr)) return doc;
  const at = Math.max(0, Math.min(toIndex, toArr.length));
  toArr.splice(at, 0, moved);
  return next;
}

/** Duplicate the block at index — re-keys ids on the clone so React + the editor don't collide. */
export function duplicateBlockAt(doc: AdvanceDocument, parentPath: DocPath, index: number): AdvanceDocument {
  return updatePath<Block[]>(doc, parentPath, (arr) => {
    const safe = Array.isArray(arr) ? arr : [];
    if (index < 0 || index >= safe.length) return safe;
    const dup = rekeyIds(clone(safe[index]));
    const out = safe.slice();
    out.splice(index + 1, 0, dup);
    return out;
  });
}

/** Shorthand: parentPath + index → full path to the block itself. */
export function blockPath(parentPath: DocPath, index: number): DocPath {
  return [...parentPath, index];
}

/** Split a block path into [parentPath, index]. */
export function splitBlockPath(p: DocPath): { parent: DocPath; index: number } {
  return { parent: p.slice(0, -1), index: Number(p[p.length - 1]) };
}

/** Are two paths equal? */
export function pathsEqual(a: DocPath, b: DocPath): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// ─── Internals ──────────────────────────────────────────────────────────

let idSeq = 0;
function nextId(): string {
  idSeq += 1;
  return `b${Date.now().toString(36)}_${idSeq.toString(36)}`;
}

/** Rewrite every `id` field inside a block (and its descendants) so a
 *  duplicated subtree has fresh ids. */
function rekeyIds(b: Block): Block {
  b.id = nextId();
  switch (b.type) {
    case 'section':
    case 'repeat':
    case 'conditional':
      b.props.blocks = b.props.blocks.map(rekeyIds);
      break;
    case 'columns':
      b.props.columns = b.props.columns.map((c) => ({ ...c, blocks: c.blocks.map(rekeyIds) }));
      break;
    default:
      break;
  }
  return b;
}

/** Generate a new unique id (exported for the block factory). */
export function newId(): string { return nextId(); }
