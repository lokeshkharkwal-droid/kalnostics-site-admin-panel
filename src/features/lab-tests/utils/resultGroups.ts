import { arrayMove } from '@dnd-kit/sortable'
import type { ResultItem } from '../interfaces'

/**
 * Result groups of a lab test, as the Results section lists them (one card per group).
 * A group is not stored on its own: it is the run of parameters (`LabTest.results`) sharing a `groupName`,
 * listed in the order each one first appears. That order is what gets saved, since every parameter's place
 * in `results` is sent as its `sortOrder` (see `mapping.ts` `toWriteDto`).
 * Ported from kaltros-fe `MasterData/utils/resultGroups.ts`.
 */

/** The parameters bucketed by `groupName`, each group in the order it first appears and its parameters in their own order. */
export function groupResults<T extends Pick<ResultItem, 'groupName'>>(results: readonly T[]): { key: string; items: T[] }[] {
  const groups: { key: string; items: T[] }[] = []
  const byKey = new Map<string, T[]>()
  results.forEach(r => {
    let items = byKey.get(r.groupName)
    if (!items) {
      items = []
      byKey.set(r.groupName, items)
      groups.push({ key: r.groupName, items })
    }
    items.push(r)
  })
  return groups
}

/**
 * Move the group listed at `from` so that it is listed at `to` (drag-to-reorder in the Results section).
 * All parameters of a group move together and keep their own order; the other groups keep theirs.
 * Returns a NEW array of the SAME parameter objects, or the input itself when nothing moves.
 */
export function moveResultGroup<T extends Pick<ResultItem, 'groupName'>>(results: readonly T[], from: number, to: number): T[] {
  const groups = groupResults(results)
  if (from === to || from < 0 || to < 0 || from >= groups.length || to >= groups.length) return results as T[]
  return arrayMove(groups, from, to).flatMap(g => g.items)
}
