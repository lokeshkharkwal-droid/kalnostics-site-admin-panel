import type { AuditActionValue, AuditModuleValue } from '../interfaces'

/** Options for the Module filter dropdown (value = backend enum, label = human). */
export const MODULE_OPTIONS: { value: AuditModuleValue; label: string }[] = [
  { value: 'USER', label: 'User' },
  { value: 'BRANCH', label: 'Branch' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'TENANT', label: 'Tenant' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'SUB_CATEGORY', label: 'Sub Category' },
  { value: 'MASTER_DATA', label: 'Master Data' },
  { value: 'LAB_TEST', label: 'Lab Test' },
  { value: 'LAB_PANEL', label: 'Lab Panel' },
  { value: 'OUTSOURCE_CENTER', label: 'Outsource Center' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'REFERRAL_PANEL', label: 'Referral Panel' },
  { value: 'REFERRAL_PANEL_SETTINGS', label: 'Referral Panel Settings' },
  { value: 'REFERRAL_DOCTOR', label: 'Referral Doctor' },
  { value: 'EXTERNAL_REFERRAL', label: 'External Referral' },
  { value: 'INTERNAL_REFERRAL', label: 'Internal Referral' },
  { value: 'MACHINE', label: 'Machine' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'TEMPLATE', label: 'Template' },
  { value: 'PDF_REPORT_TEMPLATE', label: 'PDF Report Template' },
  { value: 'AUTH', label: 'Auth' },
  { value: 'SITEADMIN', label: 'Site Admin' },
]

/** Options for the Action filter dropdown. */
export const ACTION_OPTIONS: { value: AuditActionValue; label: string }[] = [
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'OTHER', label: 'Other' },
]

/** Page size for the audit table. */
export const AUDIT_PAGE_LIMIT = 20
