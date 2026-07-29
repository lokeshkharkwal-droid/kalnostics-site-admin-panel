/**
 * Per-context token catalog used by the editor's autocomplete.
 *
 * Each entry is a `{path, description, kind}` triple — `path` is what
 * gets pasted into the field (without the `{}` wrapper); `kind`
 * narrows the suggestion list (string / number / array). Kept in
 * lockstep with the backend context builders in
 * `backend/src/modules/pdf-v2/contexts/*-context.ts` — when those
 * grow new fields, mirror them here.
 *
 * `array` paths are useful for `repeat.items` and
 * `parameters-table.items`. The editor surfaces the iteration variable
 * fields too (e.g. `{test.results}` inside a repeat with `as: 'test'`).
 */

import type { AdvanceContextType } from '@/lib/pdf-v2-types';

export type TokenKind = 'string' | 'number' | 'array';

export interface TokenSuggestion {
  /** Path inside the context — paste as `{path}`. */
  path:        string;
  /** Plain-English purpose. */
  description: string;
  /** Used to filter suggestions when the field expects a specific kind. */
  kind:        TokenKind;
}

const COMMON: TokenSuggestion[] = [
  // Branch
  { path: 'branch.name',    description: 'Branch / lab business name',                kind: 'string' },
  { path: 'branch.address', description: 'Branch street address',                     kind: 'string' },
  { path: 'branch.phone',   description: 'Branch phone number',                       kind: 'string' },
  { path: 'branch.email',   description: 'Branch contact email',                      kind: 'string' },
  { path: 'branch.logo',    description: 'Branch logo URL (auto for `logo` block)',   kind: 'string' },

  // Patient
  { path: 'patient.full_name',       description: 'Patient full name',                kind: 'string' },
  { path: 'patient.salutation',      description: 'Mr / Mrs / Dr / Master',           kind: 'string' },
  { path: 'patient.age',             description: 'Patient age (e.g. "32 Yrs.")',     kind: 'string' },
  { path: 'patient.gender',          description: 'Patient gender (M/F/O)',           kind: 'string' },
  { path: 'patient.registration_no', description: 'Patient registration / unique id', kind: 'string' },

  // Order
  { path: 'order.display_id',        description: 'Order display id (legacy "order #")', kind: 'string' },
  { path: 'order.date',              description: 'Order creation date',                kind: 'string' },
  { path: 'order.external_id',       description: 'External order id (from order_field)', kind: 'string' },
];

const LAB_REPORT: TokenSuggestion[] = [
  { path: 'category_external_id',  description: 'Category external id (only on category-order print)', kind: 'string' },
  { path: 'health_score',          description: 'Computed health score (0-100)',           kind: 'number' },
  { path: 'organs',                description: 'Per-organ status array (name + status)',  kind: 'array'  },
  { path: 'tests',                 description: 'Lab tests on this order (use in repeat)', kind: 'array'  },
  { path: 'tests[0].name',         description: 'Name of the first test',                  kind: 'string' },
  { path: 'tests[0].results',      description: 'Result rows of the first test',           kind: 'array'  },
  { path: 'tests[0].normal_results',   description: 'Result rows whose status is normal',  kind: 'array'  },
  { path: 'tests[0].abnormal_results', description: 'Borderline + abnormal result rows',   kind: 'array'  },
  // Inside `repeat as: 'test'`
  { path: 'test.name',             description: '(inside repeat=test) test name',          kind: 'string' },
  { path: 'test.department',       description: '(inside repeat=test) department',         kind: 'string' },
  { path: 'test.status',           description: '(inside repeat=test) overall status',     kind: 'string' },
  { path: 'test.results',          description: '(inside repeat=test) all result rows',    kind: 'array'  },
  { path: 'test.normal_results',   description: '(inside repeat=test) normal rows',        kind: 'array'  },
  { path: 'test.abnormal_results', description: '(inside repeat=test) abnormal rows',      kind: 'array'  },
  { path: 'test.test_note',           description: '(inside repeat=test) "Test Note" rich-text from entry form',         kind: 'string' },
  { path: 'test.overall_result_note', description: '(inside repeat=test) "Overall Result Note" rich-text',                kind: 'string' },
  { path: 'test.test_comment',        description: '(inside repeat=test) "Test Comment" rich-text (sample-group level)',  kind: 'string' },
  { path: 'test.interpretation',      description: '(inside repeat=test) interpretation HTML — only when "Print Interpretation" is checked', kind: 'string' },
];

const ORDER_INVOICE: TokenSuggestion[] = [
  { path: 'patient.mobile',          description: 'Patient mobile number',     kind: 'string' },
  { path: 'patient.email',           description: 'Patient email',             kind: 'string' },
  { path: 'order.payment_method',    description: 'Payment method (cash, …)',  kind: 'string' },
  { path: 'order.referring_panel',   description: 'Referring panel name',      kind: 'string' },
  { path: 'order.referring_doctor',  description: 'Referring doctor name',     kind: 'string' },
  { path: 'bill.original',           description: 'Total before discount',     kind: 'string' },
  { path: 'bill.discount',           description: 'Discount amount',           kind: 'string' },
  { path: 'bill.tax',                description: 'Tax amount',                kind: 'string' },
  { path: 'bill.total',              description: 'Billed total',              kind: 'string' },
  { path: 'bill.paid',               description: 'Amount paid',               kind: 'string' },
  { path: 'bill.balance',            description: 'Outstanding balance',       kind: 'string' },
  { path: 'bill.status',             description: 'Payment status label',      kind: 'string' },
  { path: 'items',                   description: 'Order line items array',    kind: 'array'  },
  { path: 'item.name',               description: '(inside repeat=item) line name',        kind: 'string' },
  { path: 'item.quantity',           description: '(inside repeat=item) qty',              kind: 'number' },
  { path: 'item.original_price',     description: '(inside repeat=item) price before discount', kind: 'string' },
  { path: 'item.discount_amount',    description: '(inside repeat=item) discount amount',  kind: 'string' },
  { path: 'item.price',              description: '(inside repeat=item) net unit price',   kind: 'string' },
  { path: 'item.total',              description: '(inside repeat=item) line total',       kind: 'string' },
];

export function tokenCatalogFor(contextType: AdvanceContextType): TokenSuggestion[] {
  switch (contextType) {
    case 'lab_report':    return [...COMMON, ...LAB_REPORT];
    case 'order_invoice':
    case 'order_bill':    return [...COMMON, ...ORDER_INVOICE];
  }
}
