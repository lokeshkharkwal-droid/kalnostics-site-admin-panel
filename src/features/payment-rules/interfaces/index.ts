/* Payment Rules feature types. Payment rules are platform-level (SiteAdmin,
   no tenant scoping); `tenantId`/`branchId` are plain optional int scope
   references. Backend: /api/v1/siteadmin/payment-rules. */

export type PaymentRuleType =
  | 'CITRUS_COMMISSION'
  | 'PAYU_COMMISSION'
  | 'PINELAB_COMMISSION'
  | 'EZ_COMMISSION'
  | 'PHARMACY_TAXES'

export type PaymentCalculationType = 'FIXED' | 'PERCENT' | 'RULE'

export type StatusFilter = '' | 'ACTIVE' | 'INACTIVE'

/** Human labels for the `ruleType` enum (Rule column, form select, filter). */
export const RULE_TYPE_LABELS: Record<PaymentRuleType, string> = {
  CITRUS_COMMISSION: 'Citrus Commission',
  PAYU_COMMISSION: 'PayU Commission',
  PINELAB_COMMISSION: 'PineLab Commission',
  EZ_COMMISSION: 'EZ Commission',
  PHARMACY_TAXES: 'Pharmacy Taxes',
}

/** Human labels for the `calculationType` enum. */
export const CALC_TYPE_LABELS: Record<PaymentCalculationType, string> = {
  FIXED: 'Fixed',
  PERCENT: 'Percent',
  RULE: 'Rule (Formula)',
}

/** Backend entity shape (as returned by the API). */
export interface PaymentRuleEntity {
  id: string
  ruleType: PaymentRuleType
  name: string
  code: string
  description: string | null
  tenantId: number | null
  branchId: number | null
  rank: number
  contextType: number | null
  contextId: number | null
  class1: string | null
  class2: string | null
  calculationType: PaymentCalculationType
  calculationValue: string
  taxType: string | null
  taxPercentage: number | null
  effectivePeriodStartDate: string | null
  effectivePeriodEndDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/** Rich UI model edited by the form. Numeric fields use `'' ` for empty inputs;
    dates are `YYYY-MM-DD` strings for the native date picker. Mapped to/from the
    backend in ../utils/mapping.ts. */
export interface PaymentRule {
  id: string
  ruleType: PaymentRuleType
  name: string
  code: string
  description: string
  tenantId: number | ''
  branchId: number | ''
  rank: number | ''
  contextType: number | ''
  contextId: number | ''
  class1: string
  class2: string
  calculationType: PaymentCalculationType
  calculationValue: string
  taxType: string
  taxPercentage: number | ''
  effectivePeriodStartDate: string
  effectivePeriodEndDate: string
  isActive: boolean
}

/** Payload sent to create/update endpoints. */
export interface PaymentRuleWriteDto {
  ruleType: PaymentRuleType
  name: string
  code: string
  description?: string
  tenantId?: number
  branchId?: number
  rank: number
  contextType?: number
  contextId?: number
  class1?: string
  class2?: string
  calculationType: PaymentCalculationType
  calculationValue: string
  taxType?: string
  taxPercentage?: number
  effectivePeriodStartDate?: string
  effectivePeriodEndDate?: string
  isActive: boolean
}

export interface ListPaymentRulesParams {
  page?: number
  limit?: number
  name?: string
  ruleType?: PaymentRuleType | ''
  status?: StatusFilter
}

export interface ListPaymentRulesResult {
  rows: PaymentRuleEntity[]
  total: number
  totalPages: number
  page: number
}
