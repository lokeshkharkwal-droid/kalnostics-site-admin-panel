import type { PaymentRule } from '../interfaces'

/** A blank payment rule for the create form. Enum fields default to their first
    option (always valid); numeric fields start empty so required ones are typed. */
export function emptyPaymentRule(): PaymentRule {
  return {
    id: '',
    ruleType: 'CITRUS_COMMISSION',
    name: '',
    code: '',
    description: '',
    tenantId: '',
    branchId: '',
    rank: '',
    contextType: '',
    contextId: '',
    class1: '',
    class2: '',
    calculationType: 'FIXED',
    calculationValue: '',
    taxType: '',
    taxPercentage: '',
    effectivePeriodStartDate: '',
    effectivePeriodEndDate: '',
    isActive: true,
  }
}
