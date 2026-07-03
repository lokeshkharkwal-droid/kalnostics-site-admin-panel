import { api } from '@/shared/services/api'
import type {
  ListPaymentRulesParams,
  ListPaymentRulesResult,
  PaymentRuleEntity,
  PaymentRuleWriteDto,
} from '../interfaces'

/** Platform-level payment rules (SiteAdmin). */
const BASE = '/api/v1/siteadmin/payment-rules'

type ListMeta = { total?: number; totalPages?: number; page?: number }

/** Paginated, server-filtered list. Search is by `name`; filters by rule type + status. */
export async function listPaymentRules(params: ListPaymentRulesParams): Promise<ListPaymentRulesResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
  if (params.name?.trim()) query.name = params.name.trim()
  if (params.ruleType) query.ruleType = params.ruleType
  if (params.status) query.status = params.status

  const res = await api.get<PaymentRuleEntity[]>(BASE, { params: query })
  const meta = (res as { meta?: ListMeta }).meta ?? {}
  const rows = res.data
  return {
    rows,
    total: meta.total ?? rows.length,
    totalPages: meta.totalPages ?? 1,
    page: meta.page ?? params.page ?? 1,
  }
}

/** Fetch one payment rule. */
export async function getPaymentRule(id: string): Promise<PaymentRuleEntity> {
  const res = await api.get<PaymentRuleEntity>(`${BASE}/${id}`)
  return res.data
}

/** Create a payment rule. */
export async function createPaymentRule(dto: PaymentRuleWriteDto): Promise<PaymentRuleEntity> {
  const res = await api.post<PaymentRuleEntity>(BASE, dto, { successMessage: 'Payment rule created' })
  return res.data
}

/** Update a payment rule. */
export async function updatePaymentRule(id: string, dto: Partial<PaymentRuleWriteDto>): Promise<PaymentRuleEntity> {
  const res = await api.patch<PaymentRuleEntity>(`${BASE}/${id}`, dto, { successMessage: 'Payment rule updated' })
  return res.data
}

/** Soft-delete a payment rule. */
export async function deletePaymentRule(id: string): Promise<PaymentRuleEntity> {
  const res = await api.delete<PaymentRuleEntity>(`${BASE}/${id}`, { successMessage: 'Payment rule deleted' })
  return res.data
}
