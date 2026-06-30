/* ═══════════════════════════════════════════════════════════════════════
   Branch modules ("module mapping") — mirrors the backend `BranchType` enum
   (kalnostics-new prisma/schema.prisma). A Department / Category / Sub-Category
   template declares which modules it applies to via `moduleMapping: BranchType[]`.
   Single source of truth for the option list, labels and display formatting.
   ═══════════════════════════════════════════════════════════════════════ */

export type BranchType =
  | 'DIAGNOSTIC'
  | 'RADIOLOGY'
  | 'OPD'
  | 'IPD'
  | 'PHARMACY'
  | 'INVENTORY'
  | 'BLOOD_BANK'
  | 'FRANCHISE'
  | 'COMBINED'
  | 'ASSISTANT'
  | 'ACCESSION'
  | 'TECHNICIAN'
  | 'COLLECTION_CENTER'

/** Selectable branch modules with human labels, in backend enum order. */
export const BRANCH_TYPE_OPTIONS: { value: BranchType; label: string }[] = [
  { value: 'DIAGNOSTIC', label: 'Diagnostic' },
  { value: 'RADIOLOGY', label: 'Radiology' },
  { value: 'OPD', label: 'OPD' },
  { value: 'IPD', label: 'IPD' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'BLOOD_BANK', label: 'Blood Bank' },
  { value: 'FRANCHISE', label: 'Franchise' },
  { value: 'COMBINED', label: 'Combined' },
  { value: 'ASSISTANT', label: 'Assistant' },
  { value: 'ACCESSION', label: 'Accession' },
  { value: 'TECHNICIAN', label: 'Technician' },
  { value: 'COLLECTION_CENTER', label: 'Collection Center' },
]

const LABELS: Record<BranchType, string> = BRANCH_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<BranchType, string>,
)

/** Human label for a single branch module (falls back to the raw value). */
export function branchModuleLabel(value: BranchType): string {
  return LABELS[value] ?? value
}

/** Comma-separated labels for a module-mapping array (for the "Modules" column). */
export function formatModules(values: BranchType[] | null | undefined): string {
  if (!values || values.length === 0) return '—'
  return values.map(branchModuleLabel).join(', ')
}
