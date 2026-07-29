/**
 * Messaging template types. Mirrors the rebuilt backend contract at
 * `/api/v1/siteadmin/templates` (SiteAdmin global templates — `tenant_id` NULL,
 * shared across every business). The schema is flat and messaging-only:
 * `preference` (channel) + `feature` (business event) + a `template` body, plus
 * optional SMS / WhatsApp delivery settings and scope targeting.
 */

// ── Enum string-unions (mirror the Prisma enums) ─────────────────────────────

/** Delivery channel (Prisma `MessagingChannel`). */
export type MessagingChannel = 'EMAIL' | 'SMS' | 'IAM' | 'IAA' | 'PBN' | 'WHATSAPP' | 'TEMPLATE'

/** Message classification (Prisma `MessageType`). */
export type MessageType = 'OTP' | 'TRANSACTIONAL' | 'MARKETING'

/** SMS classification (Prisma `SmsType`). */
export type SmsType = 'TRANSACTIONAL' | 'PROMOTIONAL'

/** WhatsApp message type (Prisma `WhatsappMessageType`). */
export type WhatsappMessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'

/** WhatsApp template category (Prisma `WhatsappTemplateCategory`). */
export type WhatsappTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'

/** Branch type a template applies to (Prisma `ApplicableBranchType`). */
export type ApplicableBranchType = 'LAB' | 'CLINIC' | 'HOSPITAL' | 'BLOOD_BANK' | 'RADIOLOGY'

/** Ownership level (Prisma `MessagingLevel`). */
export type MessagingLevel = 'ADMIN' | 'BUSINESS'

/** Product the template is scoped to (Prisma `ApplicationScope`). */
export type ApplicationScope = 'KALNOSTIC'

// ── API shapes ────────────────────────────────────────────────────────────────

/** Full template as returned by GET `/:id` and list rows. */
export interface MessagingTemplate {
  id: string
  tenantId: string | null
  branchId: string | null
  preference: MessagingChannel
  feature: string
  displayTitle: string | null
  messageType: MessageType | null
  isActive: boolean
  isDefault: boolean
  isEnabled: boolean
  specificApplication: ApplicationScope | null
  applicableBranchType: ApplicableBranchType | null
  level: MessagingLevel
  entityId: string | null
  entityType: string | null
  smsTemplateId: string | null
  smsSenderId: string | null
  smsType: SmsType | null
  template: string
  templateType: WhatsappMessageType | null
  templateCategory: WhatsappTemplateCategory | null
  fileName: string | null
  createdAt: string
  updatedAt: string | null
}

/**
 * POST / PATCH body — the DTO the backend validates. `preference`, `feature` and
 * `template` are required; everything else is optional. `templateType` /
 * `templateCategory` are required only when `preference === 'WHATSAPP'`.
 */
export interface MessagingTemplateWriteDto {
  preference: MessagingChannel
  feature: string
  template: string
  displayTitle?: string
  messageType?: MessageType
  isActive?: boolean
  isDefault?: boolean
  isEnabled?: boolean
  specificApplication?: ApplicationScope
  applicableBranchType?: ApplicableBranchType
  level?: MessagingLevel
  entityId?: string
  entityType?: string
  smsTemplateId?: string
  smsSenderId?: string
  smsType?: SmsType
  templateType?: WhatsappMessageType
  templateCategory?: WhatsappTemplateCategory
  fileName?: string
}

/**
 * Editable form model held by the editor. All fields are present (no optionals)
 * so inputs stay controlled; enum-less selections use `''` for "unset" and the
 * mapper drops empty values when building the write DTO.
 */
export interface MessagingTemplateForm {
  preference: MessagingChannel
  feature: string
  template: string
  displayTitle: string
  messageType: MessageType | ''
  isActive: boolean
  isDefault: boolean
  isEnabled: boolean
  specificApplication: ApplicationScope | ''
  applicableBranchType: ApplicableBranchType | ''
  level: MessagingLevel
  entityId: string
  entityType: string
  smsTemplateId: string
  smsSenderId: string
  smsType: SmsType | ''
  templateType: WhatsappMessageType | ''
  templateCategory: WhatsappTemplateCategory | ''
  fileName: string
}

export interface ListTemplatesParams {
  page?: number
  limit?: number
  search?: string
  preference?: MessagingChannel | ''
  feature?: string
  messageType?: MessageType | ''
  level?: MessagingLevel | ''
  applicableBranchType?: ApplicableBranchType | ''
  isActive?: '' | 'true' | 'false'
  isEnabled?: '' | 'true' | 'false'
  isDefault?: '' | 'true' | 'false'
}

export interface ListTemplatesResult {
  rows: MessagingTemplate[]
  total: number
  totalPages: number
  page: number
}
