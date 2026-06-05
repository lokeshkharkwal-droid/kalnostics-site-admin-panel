/**
 * Dummy subscription-plan data.
 *
 * kalnostics-new does NOT (yet) expose subscription-plan endpoints — only a
 * `subscriptionPlanId` / `subscriptionStatus` field on the Tenant model and a
 * `subscription-plans:write` permission reserved for the future. Until that
 * backend module exists, the Subscription Plans screen runs entirely off this
 * in-memory fixture so the UI can be reviewed end-to-end.
 *
 * When the real API lands, delete this file and restore the React Query calls
 * in `app/admin/dashboard/plans/page.tsx` (see the comments there).
 */

export interface PlanLimits {
  users: number
  branches: number
  analyzer_count: number
  b2b_logins: number
  collection_centers: number
  training_sessions: number
  inventory_branches: number
  support_level: string
}

export interface Plan {
  id: string
  key: string
  name: string
  tagline: string | null
  isActive: boolean
  isContactSales: boolean
  priceMonthly: number
  priceYearly: number | null
  originalPriceMonthly: number | null
  originalPriceYearly: number | null
  currency: string
  gracePeriodDays: number
  planCategory: string
  sortOrder: number
  limits: PlanLimits
}

export interface PlanFeatureRow {
  featureKey: string
  label: string
  category: string | null
  isIncluded: boolean
  notes: string | null
}

export interface PlanDetail {
  plan: Plan
  features: PlanFeatureRow[]
}

/** Feature catalogue shared across all plans (toggled per plan via isIncluded). */
function featureSet(included: Record<string, boolean>): PlanFeatureRow[] {
  const catalogue: Omit<PlanFeatureRow, 'isIncluded'>[] = [
    { featureKey: 'lab_orders',        label: 'Lab Order Management',     category: 'core',          notes: null },
    { featureKey: 'radiology',         label: 'Radiology Module',         category: 'core',          notes: null },
    { featureKey: 'inventory',         label: 'Inventory Tracking',       category: 'core',          notes: null },
    { featureKey: 'pdf_templates',     label: 'Custom PDF Templates',     category: 'reporting',     notes: null },
    { featureKey: 'whatsapp_reports',  label: 'WhatsApp Report Delivery', category: 'reporting',     notes: null },
    { featureKey: 'analytics',         label: 'Analytics Dashboard',      category: 'reporting',     notes: null },
    { featureKey: 'b2b_portal',        label: 'B2B Partner Portal',       category: 'growth',        notes: null },
    { featureKey: 'collection_centers',label: 'Collection Centers',       category: 'growth',        notes: null },
    { featureKey: 'white_label',       label: 'White-label Branding',     category: 'growth',        notes: null },
    { featureKey: 'api_access',        label: 'Public API Access',        category: 'integration',   notes: null },
    { featureKey: 'priority_support',  label: 'Priority Support',         category: 'integration',   notes: null },
  ]
  return catalogue.map(f => ({ ...f, isIncluded: included[f.featureKey] ?? false }))
}

export const MOCK_PLANS: PlanDetail[] = [
  {
    plan: {
      id: 'plan-standard', key: 'standard', name: 'Standard', tagline: 'For single-branch labs getting started',
      isActive: true, isContactSales: false, priceMonthly: 2999, priceYearly: 29990,
      originalPriceMonthly: null, originalPriceYearly: null, currency: 'INR',
      gracePeriodDays: 7, planCategory: 'standard', sortOrder: 1,
      limits: { users: 5, branches: 1, analyzer_count: 2, b2b_logins: 0, collection_centers: 0, training_sessions: 1, inventory_branches: 1, support_level: 'call_whatsapp' },
    },
    features: featureSet({ lab_orders: true, radiology: false, inventory: true, pdf_templates: true, whatsapp_reports: true }),
  },
  {
    plan: {
      id: 'plan-silver', key: 'silver', name: 'Silver', tagline: 'Multi-branch with radiology',
      isActive: true, isContactSales: false, priceMonthly: 5999, priceYearly: 59990,
      originalPriceMonthly: 7999, originalPriceYearly: null, currency: 'INR',
      gracePeriodDays: 14, planCategory: 'standard', sortOrder: 2,
      limits: { users: 15, branches: 3, analyzer_count: 5, b2b_logins: 2, collection_centers: 3, training_sessions: 2, inventory_branches: 3, support_level: 'call_whatsapp' },
    },
    features: featureSet({ lab_orders: true, radiology: true, inventory: true, pdf_templates: true, whatsapp_reports: true, analytics: true, collection_centers: true }),
  },
  {
    plan: {
      id: 'plan-gold', key: 'gold', name: 'Gold', tagline: 'Growing chains needing B2B & analytics',
      isActive: true, isContactSales: false, priceMonthly: 11999, priceYearly: 119990,
      originalPriceMonthly: null, originalPriceYearly: null, currency: 'INR',
      gracePeriodDays: 21, planCategory: 'standard', sortOrder: 3,
      limits: { users: 50, branches: 10, analyzer_count: 15, b2b_logins: 10, collection_centers: 10, training_sessions: 5, inventory_branches: 10, support_level: '24_7_all' },
    },
    features: featureSet({ lab_orders: true, radiology: true, inventory: true, pdf_templates: true, whatsapp_reports: true, analytics: true, b2b_portal: true, collection_centers: true, white_label: true }),
  },
  {
    plan: {
      id: 'plan-platinum', key: 'platinum', name: 'Platinum', tagline: 'Enterprise — unlimited scale & API',
      isActive: true, isContactSales: true, priceMonthly: 0, priceYearly: null,
      originalPriceMonthly: null, originalPriceYearly: null, currency: 'INR',
      gracePeriodDays: 30, planCategory: 'enterprise', sortOrder: 4,
      limits: { users: -1, branches: -1, analyzer_count: -1, b2b_logins: -1, collection_centers: -1, training_sessions: -1, inventory_branches: -1, support_level: '24_7_all' },
    },
    features: featureSet({ lab_orders: true, radiology: true, inventory: true, pdf_templates: true, whatsapp_reports: true, analytics: true, b2b_portal: true, collection_centers: true, white_label: true, api_access: true, priority_support: true }),
  },
]
