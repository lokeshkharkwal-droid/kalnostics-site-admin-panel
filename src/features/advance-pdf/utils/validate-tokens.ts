/**
 * Walk an AdvanceDocument and surface every `{token}` reference whose
 * root path isn't recognised by the current context type's catalog —
 * the editor's "Validate" panel uses this to flag templates that will
 * silently render empty for fields like `{patient.unknown}` or typos
 * such as `{tests[0].nme}`.
 *
 * Rules:
 *   - A token is the substring inside `{…}` that doesn't contain `{` `}`.
 *   - The "root" is the first identifier (before the first `.` or `[`).
 *   - A token validates when its root is in the catalog OR it's a
 *     repeat-iterator name in scope (e.g. `test` inside `repeat as: test`).
 *   - `branch.unknown` warns; `branch.name` doesn't. We only check
 *     roots — full path validation would require duplicating the entire
 *     context shape on the frontend, which doesn't pay off.
 */

import type { Block, AdvanceDocument, AdvanceContextType } from '@/lib/pdf-v2-types';
import { tokenCatalogFor } from './token-catalog';

export interface ValidationIssue {
  /** Free-form description of where the bad token came from. */
  location: string;
  token:    string;
  /** Why we flagged it. */
  reason:   string;
}

const TOKEN_RE = /\{([^{}]+)\}/g;

export function validateTokens(
  doc: AdvanceDocument,
  contextType: AdvanceContextType,
): ValidationIssue[] {
  const catalogRoots = new Set(
    tokenCatalogFor(contextType).map((t) => rootOf(t.path)),
  );
  const issues: ValidationIssue[] = [];
  walkBlocks(doc.header.blocks, ['header'], catalogRoots, [], issues);
  walkBlocks(doc.body.blocks,   ['body'],   catalogRoots, [], issues);
  walkBlocks(doc.footer.blocks, ['footer'], catalogRoots, [], issues);
  return issues;
}

function walkBlocks(
  blocks: Block[],
  trail: string[],
  catalogRoots: Set<string>,
  scopeVars: string[],
  issues: ValidationIssue[],
) {
  blocks.forEach((b, i) => {
    const here = [...trail, `${b.type}[${i}]`];
    walkBlock(b, here, catalogRoots, scopeVars, issues);
  });
}

function walkBlock(
  b: Block,
  trail: string[],
  catalogRoots: Set<string>,
  scopeVars: string[],
  issues: ValidationIssue[],
) {
  const where = trail.join(' › ');
  const check = (s: string | undefined | null) => {
    if (!s) return;
    let m: RegExpExecArray | null;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(s)) !== null) {
      const raw = m[1].trim();
      const root = rootOf(raw);
      if (!root) continue;
      if (scopeVars.includes(root)) continue;
      if (catalogRoots.has(root))   continue;
      issues.push({
        location: where,
        token:    `{${raw}}`,
        reason:   `Unknown root "${root}" for this context.`,
      });
    }
  };

  switch (b.type) {
    case 'heading':    check(b.props.text); break;
    case 'paragraph':  check(b.props.text); break;
    case 'kv':         check(b.props.label); check(b.props.value); break;
    case 'qr':         check(b.props.value); break;
    case 'signature':  check(b.props.name); check(b.props.title); break;
    case 'image':      check(b.props.src); check(b.props.alt); break;
    case 'table':      if (typeof b.props.rows === 'string') check(b.props.rows); break;
    case 'parameters-table':
      check(b.props.items); break;
    case 'range-bar':
      check(b.props.title); check(b.props.description); check(b.props.unit);
      if (typeof b.props.value === 'string') check(b.props.value);
      for (const k of ['low', 'normal_low', 'normal_high', 'high'] as const) {
        const v = b.props[k];
        if (typeof v === 'string') check(v);
      }
      break;
    case 'score-circle':
      if (typeof b.props.value === 'string') check(b.props.value);
      if (typeof b.props.max === 'string')   check(b.props.max);
      check(b.props.label);
      break;
    case 'status-pill':
      check(b.props.status); check(b.props.label);
      break;
    case 'result-card':
      check(b.props.item); check(b.props.description); check(b.props.reason_title);
      break;
    case 'note-card':
      check(b.props.title); check(b.props.content);
      break;
    case 'organ-diagram': check(b.props.title); check(b.props.items); break;
    case 'donut-chart':   check(b.props.title); check(b.props.slices); break;
    case 'bar-chart':     check(b.props.title); check(b.props.bars); break;
    case 'line-chart':    check(b.props.title); check(b.props.points); break;
    case 'conditional':
      check(b.props.when);
      walkBlocks(b.props.blocks, trail, catalogRoots, scopeVars, issues);
      break;
    case 'repeat': {
      check(b.props.items);
      const nextScope = b.props.as && !scopeVars.includes(b.props.as)
        ? [...scopeVars, b.props.as]
        : scopeVars;
      walkBlocks(b.props.blocks, trail, catalogRoots, nextScope, issues);
      break;
    }
    case 'section':
      walkBlocks(b.props.blocks, trail, catalogRoots, scopeVars, issues);
      break;
    case 'columns':
      b.props.columns.forEach((c, i) => {
        walkBlocks(c.blocks, [...trail, `column[${i}]`], catalogRoots, scopeVars, issues);
      });
      break;
    default:
      break;
  }
}

function rootOf(path: string): string {
  const m = /^([A-Za-z_][\w]*)/.exec(path);
  return m ? m[1] : '';
}
