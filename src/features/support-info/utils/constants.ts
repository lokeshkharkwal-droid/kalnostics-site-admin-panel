import type { SupportInfo, SupportStatus, SupportTenantType } from '../interfaces'

/** A blank record for the create form. */
export function emptySupportInfo(): SupportInfo {
  return {
    id: '',
    metaType: '',
    code: '',
    title: '',
    tenantType: 'BUSINESS',
    status: 'ACTIVE',
    requestUrl: '',
    help: '',
  }
}

export const TENANT_TYPE_OPTIONS: { value: SupportTenantType; label: string }[] = [
  { value: 'BUSINESS', label: 'Business' },
  { value: 'BRANCH', label: 'Branch' },
]

export const STATUS_OPTIONS: { value: SupportStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

/** Suggested meta-type values (free text; backend does not enum-constrain it). */
export const META_TYPE_SUGGESTIONS = ['FAQ', 'GUIDE', 'POLICY', 'TOOLTIP', 'ONBOARDING', 'RELEASE_NOTE']
