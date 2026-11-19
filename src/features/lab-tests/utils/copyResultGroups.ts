import type { LabTest, ReferenceRangeItem, ReferenceValueItem, ResultItem } from '../interfaces'

/**
 * "Copy Result" in the Add New Test form: copy whole result groups of another (saved) lab test template into the
 * test being filled in, together with every reference range and reference value of their parameters.
 *
 * Ported from the business FE (kaltros-fe `MasterData/utils/copyResultGroups.ts`). The difference here is that
 * reference ranges / values link to their parameter BY NAME (`parameter` === `parameterName`, see `mapping.ts`
 * `resultToDto`), so a parameter whose name OR code is already used in the target is skipped — copying it would
 * merge its ranges/values with the existing parameter's.
 *
 * Nothing here touches the source test. Every copied row is a NEW object with a NEW local id; the write DTO sends
 * no row ids, so the backend creates new rows on Save.
 */

/** The parts of a test the copy reads and writes. */
export type ResultData = Pick<LabTest, 'results' | 'referenceRanges' | 'referenceValues'>

export interface CopyResultGroupsOutcome {
  /** The target's results / ranges / values with the copies appended (the target's own rows untouched, in order). */
  next: ResultData
  /** Groups copied (by their listed label), in source order. */
  copiedGroups: string[]
  /** Selected groups not copied because a group with the same label is already in the target. */
  skippedGroups: string[]
  /** Parameters not copied because their name or code is already used in the target, as "Name (CODE)". */
  skippedParameters: string[]
  /** Copied calculated parameters whose formula uses a code that is not in the resulting test. */
  unresolvedFormulaRefs: { parameter: string; refs: string[] }[]
  counts: { parameters: number; ranges: number; values: number }
}

/** Label of the blank group (parameters with no Group Name). */
export const UNGROUPED = '(Ungrouped)'

/** The label a parameter's group is listed under. Same bucketing as `ResultsSection` (by exact groupName). */
export const groupKeyOf = (r: Pick<ResultItem, 'groupName'>): string => r.groupName || UNGROUPED

/** The parameters bucketed by group, each group in the order it first appears and its parameters in their own order. */
export function groupResults<T extends Pick<ResultItem, 'groupName'>>(results: readonly T[]): { key: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const r of results) {
    const key = groupKeyOf(r)
    const items = map.get(key)
    if (items) items.push(r)
    else map.set(key, [r])
  }
  return Array.from(map, ([key, items]) => ({ key, items }))
}

/** The group labels a test's form already lists. */
export const existingGroupKeys = (results: readonly Pick<ResultItem, 'groupName'>[]): Set<string> =>
  new Set(results.map(groupKeyOf))

let seq = 0
/** A local row id: unique, and never UUID-shaped. */
export const makeCopyId = (prefix: 'r' | 'rr' | 'rv'): string =>
  `${prefix}-copy-${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/** Compare names / codes the way a clash would be judged (trimmed, any case). */
const norm = (s: string | undefined | null): string => (s ?? '').trim().toLowerCase()

/** Parameter-code identifiers a formula refers to (runs of [A-Za-z0-9_] that are not plain numbers). */
export const extractFormulaRefs = (formula: string): string[] =>
  Array.from(new Set((formula.match(/[A-Za-z0-9_]+/g) ?? []).filter(t => !/^\d+$/.test(t))))

/**
 * Copy the result groups `groupKeys` of `source` into `target`.
 *
 * - A selected group whose label is already in `target` is skipped as a whole (`skippedGroups`).
 * - A parameter whose name or code is already used (in `target`, or by a parameter copied before it) is skipped
 *   together with its ranges and values (`skippedParameters`).
 * - Only the ranges and values of the copied parameters are copied, in their source order, each keeping every value.
 * - `source` and `target` are never changed; `next` holds new arrays.
 */
export function copyResultGroups(
  source: ResultData,
  groupKeys: readonly string[],
  target: ResultData,
  makeId: (prefix: 'r' | 'rr' | 'rv') => string = makeCopyId,
): CopyResultGroupsOutcome {
  const wanted = new Set(groupKeys)
  const targetGroups = existingGroupKeys(target.results)
  const usedCodes = new Set(target.results.map(r => norm(r.parameterCode)).filter(Boolean))
  const usedNames = new Set(target.results.map(r => norm(r.parameterName)).filter(Boolean))

  const copiedGroups: string[] = []
  const skippedGroups: string[] = []
  const skippedParameters: string[] = []
  const copiedResults: ResultItem[] = []
  /** Names of the copied source parameters (copies keep the name), so only their ranges / values come along. */
  const copiedNames = new Set<string>()

  for (const group of groupResults(source.results)) {
    if (!wanted.has(group.key)) continue
    if (targetGroups.has(group.key)) {
      skippedGroups.push(group.key)
      continue
    }
    let copiedAny = false
    for (const param of group.items) {
      const code = norm(param.parameterCode)
      const name = norm(param.parameterName)
      if ((code && usedCodes.has(code)) || (name && usedNames.has(name))) {
        skippedParameters.push(param.parameterCode ? `${param.parameterName} (${param.parameterCode})` : param.parameterName)
        continue
      }
      if (code) usedCodes.add(code)
      if (name) usedNames.add(name)
      copiedResults.push({
        ...param,
        id: makeId('r'),
        reflexTests: param.reflexTests.map(rt => ({ ...rt })),
        overallResultGroups: [...param.overallResultGroups],
        resultSuggestions: param.resultSuggestions ? [...param.resultSuggestions] : param.resultSuggestions,
        isDefault: false,
      })
      copiedNames.add(param.parameterName)
      copiedAny = true
    }
    if (copiedAny) copiedGroups.push(group.key)
  }

  const copiedRanges: ReferenceRangeItem[] = source.referenceRanges
    .filter(r => copiedNames.has(r.parameter))
    .map(r => ({ ...r, id: makeId('rr') }))
  const copiedValues: ReferenceValueItem[] = source.referenceValues
    .filter(v => copiedNames.has(v.parameter))
    .map(v => ({ ...v, id: makeId('rv') }))

  const results = [...target.results, ...copiedResults]
  // A calculated parameter copied without the parameters its formula uses would fail Save. Report those so the
  // user can fix them first.
  const finalCodes = new Set(results.map(r => (r.parameterCode ?? '').trim()).filter(Boolean))
  const unresolvedFormulaRefs = copiedResults
    .filter(r => r.calculationFormula?.trim())
    .map(r => ({ parameter: r.parameterName, refs: extractFormulaRefs(r.calculationFormula).filter(ref => !finalCodes.has(ref)) }))
    .filter(x => x.refs.length > 0)

  return {
    next: {
      results,
      referenceRanges: [...target.referenceRanges, ...copiedRanges],
      referenceValues: [...target.referenceValues, ...copiedValues],
    },
    copiedGroups,
    skippedGroups,
    skippedParameters,
    unresolvedFormulaRefs,
    counts: { parameters: copiedResults.length, ranges: copiedRanges.length, values: copiedValues.length },
  }
}
