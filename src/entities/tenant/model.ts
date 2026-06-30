/** Badge variant per subscription status (shared across dashboard + businesses). */
export const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  active:       'success',
  trialing:     'info',
  grace_period: 'warning',
  suspended:    'danger',
  cancelled:    'default',
}

/** Human-readable label per subscription status. */
export const STATUS_LABEL: Record<string, string> = {
  active:       'Active',
  trialing:     'Trialing',
  grace_period: 'Grace Period',
  suspended:    'Suspended',
  cancelled:    'Cancelled',
}

/** Status options for the businesses-list filter dropdown. */
export const STATUS_OPTIONS = [
  { value: '',             label: 'All Statuses' },
  { value: 'active',       label: 'Active' },
  { value: 'trialing',     label: 'Trialing' },
  { value: 'grace_period', label: 'Grace Period' },
  { value: 'suspended',    label: 'Suspended' },
  { value: 'cancelled',    label: 'Cancelled' },
]
