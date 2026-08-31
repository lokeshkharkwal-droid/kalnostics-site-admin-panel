'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/shared/utils'
import { AdminHeader } from '@/widgets/AdminHeader'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  PageLoader,
  SelectField,
  TextArea,
  Toggle,
} from '@/shared/ui'

import type { MessagingTemplateForm } from '../interfaces'
import { createTemplate, getTemplate, updateTemplate } from '../services/messaging-templates.api'
import {
  APPLICABLE_BRANCH_TYPE_OPTIONS,
  APPLICATION_SCOPE_OPTIONS,
  dtoFromForm,
  emptyTemplateForm,
  formFromEntity,
  LEVEL_OPTIONS,
  MESSAGE_TYPE_OPTIONS,
  MESSAGING_FEATURES_GROUPED,
  PREFERENCE_OPTIONS,
  SMS_TYPE_OPTIONS,
  WHATSAPP_CATEGORY_OPTIONS,
  WHATSAPP_TYPE_OPTIONS,
} from '../utils/constants'

const textareaMono = 'font-mono resize-y'

/** A titled card section. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">{children}</div>
      </CardContent>
    </Card>
  )
}

/**
 * One status-flag row: a bold, always-visible title with an explanatory hint on
 * the left and the on/off switch on the right, inside a bordered card so every
 * flag is visually distinct and clearly labelled.
 */
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-notion-line2 bg-white px-3 py-2.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-notion-text">{label}</span>
        <span className="text-xs text-notion-sub">{description}</span>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

/**
 * Grouped native <select> for the `feature` key — the shared SelectField doesn't
 * support <optgroup>, and the ~88 features are far more usable grouped by domain.
 */
function FeatureSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>Feature</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-8 w-full rounded-md border border-notion-line2 bg-white px-2 text-sm text-notion-text',
          'focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-notion-blue/30',
          'transition-colors duration-150',
        )}
      >
        <option value="">Select a feature…</option>
        {MESSAGING_FEATURES_GROUPED.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

/**
 * Full-page create/edit editor for a global messaging template. `id === 'new'`
 * creates; any other id edits. Sections render conditionally by the selected
 * `preference` (channel): the email body uses the Tiptap rich editor, other
 * channels use a monospace textarea with {placeholder} hints. SMS/WhatsApp
 * settings appear only for their channel.
 */
export function MessagingTemplateEditor({ id }: { id: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const isNew = id === 'new'

  const [form, setForm] = useState<MessagingTemplateForm>(emptyTemplateForm())
  const [saving, setSaving] = useState(false)

  const { data: loaded, isLoading } = useQuery({
    queryKey: ['siteadmin', 'messaging-template', id],
    queryFn: () => getTemplate(id),
    enabled: !isNew,
  })

  useEffect(() => {
    if (loaded) setForm(formFromEntity(loaded))
  }, [loaded])

  // Typed field setter.
  const set = <K extends keyof MessagingTemplateForm>(key: K, val: MessagingTemplateForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const invalidateList = () => qc.invalidateQueries({ queryKey: ['siteadmin', 'messaging-templates'] })

  const onSave = async () => {
    if (!form.feature) {
      toast.error('Feature is required')
      return
    }
    if (!form.template.trim()) {
      toast.error('Template body is required')
      return
    }
    if (form.preference === 'WHATSAPP') {
      if (!form.templateType || !form.templateCategory) {
        toast.error('WhatsApp templates require a media type and category')
        return
      }
      if (!form.smsTemplateId.trim()) {
        toast.error('WhatsApp templates require the approved WhatsApp Template ID')
        return
      }
    }
    if (form.preference === 'SMS' && (!form.smsTemplateId.trim() || !form.smsSenderId.trim())) {
      toast.error('SMS templates require a DLT Template ID and Sender ID')
      return
    }
    setSaving(true)
    try {
      const dto = dtoFromForm(form)
      if (isNew) {
        await createTemplate(dto)
      } else {
        await updateTemplate(id, dto)
      }
      invalidateList()
      router.push('/messaging-templates')
    } catch {
      /* error toast handled globally */
    } finally {
      setSaving(false)
    }
  }

  const actionBar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => router.push('/messaging-templates')}>
        Cancel
      </Button>
      <Button size="sm" loading={saving} onClick={onSave}>
        {isNew ? 'Create Template' : 'Save Changes'}
      </Button>
    </div>
  )

  if (!isNew && isLoading) {
    return (
      <div className="flex flex-col overflow-auto">
        <AdminHeader title="Edit Messaging Template" subtitle="Loading…" />
        <main className="flex-1 p-6">
          <Card>
            <CardContent>
              <PageLoader />
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const { preference } = form

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title={isNew ? 'New Messaging Template' : 'Edit Messaging Template'}
        subtitle="Configure notification template content and delivery settings"
        actions={actionBar}
      />

      <main className="flex-1 space-y-4 p-6">
        {/* Core */}
        <Section title="Core Settings">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              label="Channel (Preference)"
              value={form.preference}
              options={PREFERENCE_OPTIONS}
              onChange={(v) => set('preference', v as MessagingTemplateForm['preference'])}
            />
            <FeatureSelect value={form.feature} onChange={(v) => set('feature', v)} />
            <SelectField
              label="Message Type"
              value={form.messageType}
              options={MESSAGE_TYPE_OPTIONS}
              placeholder="—"
              onChange={(v) => set('messageType', v as MessagingTemplateForm['messageType'])}
            />
          </div>
          <Input
            label="Display Title"
            placeholder="e.g. Report Ready — Email"
            value={form.displayTitle}
            onChange={(e) => set('displayTitle', e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <Label className="text-notion-text">Status flags</Label>
            <div className="flex flex-col gap-2">
              <ToggleRow
                label="Active"
                description="Template record is active (not archived / soft-deleted)."
                checked={form.isActive}
                onChange={(v) => set('isActive', v)}
              />
              <ToggleRow
                label="Default"
                description="Use this as the fallback template for its feature + channel."
                checked={form.isDefault}
                onChange={(v) => set('isDefault', v)}
              />
              <ToggleRow
                label="Enabled"
                description="Turn on delivery of this template on its channel."
                checked={form.isEnabled}
                onChange={(v) => set('isEnabled', v)}
              />
            </div>
          </div>
        </Section>

        {/* Scope & targeting */}
        <Section title="Scope & Targeting">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              label="Level"
              value={form.level}
              options={LEVEL_OPTIONS}
              onChange={(v) => set('level', v as MessagingTemplateForm['level'])}
            />
            <SelectField
              label="Application"
              value={form.specificApplication}
              options={APPLICATION_SCOPE_OPTIONS}
              placeholder="All applications"
              onChange={(v) => set('specificApplication', v as MessagingTemplateForm['specificApplication'])}
            />
            <SelectField
              label="Applicable Branch Type"
              value={form.applicableBranchType}
              options={APPLICABLE_BRANCH_TYPE_OPTIONS}
              placeholder="All branch types"
              onChange={(v) => set('applicableBranchType', v as MessagingTemplateForm['applicableBranchType'])}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Entity ID"
              placeholder="Optional (max 45 chars)"
              value={form.entityId}
              onChange={(e) => set('entityId', e.target.value)}
            />
            <Input
              label="Entity Type"
              placeholder="Optional (max 45 chars)"
              value={form.entityType}
              onChange={(e) => set('entityType', e.target.value)}
            />
          </div>
        </Section>

        {/* SMS settings */}
        {preference === 'SMS' && (
          <Section title="SMS Settings">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="DLT Template ID *"
                placeholder="DLT-registered SMS template id"
                value={form.smsTemplateId}
                onChange={(e) => set('smsTemplateId', e.target.value)}
              />
              <Input
                label="Sender ID *"
                placeholder="DLT-registered sender / header"
                value={form.smsSenderId}
                onChange={(e) => set('smsSenderId', e.target.value)}
              />
              <SelectField
                label="SMS Type"
                value={form.smsType}
                options={SMS_TYPE_OPTIONS}
                placeholder="—"
                onChange={(v) => set('smsType', v as MessagingTemplateForm['smsType'])}
              />
            </div>
          </Section>
        )}

        {/* WhatsApp settings */}
        {preference === 'WHATSAPP' && (
          <Section title="WhatsApp Settings">
            {/* Provider delivery identifiers — the gateway sends these as
                sms_template_id / sms_sender_id / sms_type for WhatsApp too, where
                the template id is the approved WhatsApp template. Without a
                template id the message cannot be delivered. */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="WhatsApp Template ID *"
                placeholder="Approved WhatsApp (WABA) template id"
                value={form.smsTemplateId}
                onChange={(e) => set('smsTemplateId', e.target.value)}
              />
              <Input
                label="Sender ID"
                placeholder="Registered sender / WABA number"
                value={form.smsSenderId}
                onChange={(e) => set('smsSenderId', e.target.value)}
              />
              <SelectField
                label="Message Class"
                value={form.smsType}
                options={SMS_TYPE_OPTIONS}
                placeholder="—"
                onChange={(v) => set('smsType', v as MessagingTemplateForm['smsType'])}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SelectField
                label="Media Type"
                value={form.templateType}
                options={WHATSAPP_TYPE_OPTIONS}
                placeholder="Select…"
                onChange={(v) => set('templateType', v as MessagingTemplateForm['templateType'])}
              />
              <SelectField
                label="Template Category"
                value={form.templateCategory}
                options={WHATSAPP_CATEGORY_OPTIONS}
                placeholder="Select…"
                onChange={(v) => set('templateCategory', v as MessagingTemplateForm['templateCategory'])}
              />
              <Input
                label="File Name"
                placeholder="letters, digits, _ and - only"
                value={form.fileName}
                onChange={(e) => set('fileName', e.target.value)}
              />
            </div>
          </Section>
        )}

        {/* Template body — plain monospace textarea for all channels */}
        <Section title="Template Body">
          <TextArea
            label="Body"
            rows={12}
            className={textareaMono}
            value={form.template}
            onChange={(e) => set('template', e.target.value)}
            placeholder="Enter template text. Use {variable_name} for dynamic values."
          />
        </Section>

        {/* Bottom save bar */}
        {actionBar}
      </main>
    </div>
  )
}
