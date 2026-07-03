import type { PaymentRule, PaymentRuleEntity, PaymentRuleWriteDto } from '../interfaces'

/** Field-level validation errors keyed by form field. */
export type PaymentRuleErrors = Partial<Record<keyof PaymentRule, string>>

/** Backend entity → editable UI model (null → '' for inputs, ISO → YYYY-MM-DD). */
export function fromEntity(e: PaymentRuleEntity): PaymentRule {
  return {
    id: e.id,
    ruleType: e.ruleType,
    name: e.name,
    code: e.code,
    description: e.description ?? '',
    tenantId: e.tenantId ?? '',
    branchId: e.branchId ?? '',
    rank: e.rank,
    contextType: e.contextType ?? '',
    contextId: e.contextId ?? '',
    class1: e.class1 ?? '',
    class2: e.class2 ?? '',
    calculationType: e.calculationType,
    calculationValue: e.calculationValue,
    taxType: e.taxType ?? '',
    taxPercentage: e.taxPercentage ?? '',
    effectivePeriodStartDate: toDateInput(e.effectivePeriodStartDate),
    effectivePeriodEndDate: toDateInput(e.effectivePeriodEndDate),
    isActive: e.isActive,
  }
}

/** UI model → API payload. Empty optional fields are omitted; `rank` defaults to 0. */
export function toWriteDto(d: PaymentRule): PaymentRuleWriteDto {
  const dto: PaymentRuleWriteDto = {
    ruleType: d.ruleType,
    name: d.name.trim(),
    code: d.code.trim(),
    rank: typeof d.rank === 'number' ? d.rank : 0,
    calculationType: d.calculationType,
    calculationValue: d.calculationValue.trim(),
    isActive: d.isActive,
  }
  const description = d.description.trim()
  if (description) dto.description = description
  if (typeof d.tenantId === 'number') dto.tenantId = d.tenantId
  if (typeof d.branchId === 'number') dto.branchId = d.branchId
  if (typeof d.contextType === 'number') dto.contextType = d.contextType
  if (typeof d.contextId === 'number') dto.contextId = d.contextId
  const class1 = d.class1.trim()
  if (class1) dto.class1 = class1
  const class2 = d.class2.trim()
  if (class2) dto.class2 = class2
  const taxType = d.taxType.trim()
  if (taxType) dto.taxType = taxType
  if (typeof d.taxPercentage === 'number') dto.taxPercentage = d.taxPercentage
  if (d.effectivePeriodStartDate) dto.effectivePeriodStartDate = d.effectivePeriodStartDate
  if (d.effectivePeriodEndDate) dto.effectivePeriodEndDate = d.effectivePeriodEndDate
  return dto
}

/** Client-side validation of the required fields. Empty object = valid. */
export function validatePaymentRule(d: PaymentRule): PaymentRuleErrors {
  const errors: PaymentRuleErrors = {}
  if (!d.ruleType) errors.ruleType = 'Rule type is required'
  if (d.name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
  if (!d.code.trim()) errors.code = 'Code is required'
  if (typeof d.tenantId !== 'number') errors.tenantId = 'Tenant ID is required'
  if (!d.calculationType) errors.calculationType = 'Calculation type is required'
  if (!d.calculationValue.trim()) errors.calculationValue = 'Calculation value is required'
  return errors
}

// ── Display helpers (grid) ──────────────────────────────────────────────────

/** ISO timestamp → `YYYY-MM-DD` for a native date input (empty string if null). */
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

/** ISO/date string → `01 Jul 2026` (empty string if null). */
export function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Effective period as `from → to` (`—` when neither date is set). */
export function fmtDateRange(start: string | null, end: string | null): string {
  const from = fmtDate(start)
  const to = fmtDate(end)
  if (!from && !to) return '—'
  return `${from || '…'} → ${to || '…'}`
}
