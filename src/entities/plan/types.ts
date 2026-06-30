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
