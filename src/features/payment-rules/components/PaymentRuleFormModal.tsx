'use client'

import { useState } from 'react'
import { Button, Input, Label, Modal, SelectField, TextArea, Toggle } from '@/shared/ui'
import {
  CALC_TYPE_LABELS,
  RULE_TYPE_LABELS,
  type PaymentCalculationType,
  type PaymentRule,
  type PaymentRuleType,
} from '../interfaces'
import { validatePaymentRule, type PaymentRuleErrors } from '../utils/mapping'

export type FormMode = 'create' | 'edit' | 'view'

const RULE_TYPE_OPTIONS = (Object.keys(RULE_TYPE_LABELS) as PaymentRuleType[]).map((value) => ({
  value,
  label: RULE_TYPE_LABELS[value],
}))
const CALC_TYPE_OPTIONS = (Object.keys(CALC_TYPE_LABELS) as PaymentCalculationType[]).map((value) => ({
  value,
  label: CALC_TYPE_LABELS[value],
}))

/** A labelled group of form fields. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-faint">{title}</h3>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  )
}

/** Create / edit / view modal for a payment rule, organised into sections. */
export function PaymentRuleFormModal({
  rule, mode, saving, onSave, onClose,
}: {
  rule: PaymentRule
  mode: FormMode
  saving: boolean
  onSave: (r: PaymentRule) => void
  onClose: () => void
}) {
  const [data, setData] = useState<PaymentRule>({ ...rule })
  const [errors, setErrors] = useState<PaymentRuleErrors>({})
  const readOnly = mode === 'view'

  const set = <K extends keyof PaymentRule>(field: K, val: PaymentRule[K]) =>
    setData((prev) => ({ ...prev, [field]: val }))

  /** Numeric-input change → number, or '' when cleared. */
  const setNum = (field: keyof PaymentRule) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    set(field, (v === '' ? '' : Number(v)) as PaymentRule[typeof field])
  }

  const submit = () => {
    const errs = validatePaymentRule(data)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSave(data)
  }

  const title = mode === 'create' ? 'New Payment Rule' : mode === 'edit' ? 'Edit Payment Rule' : 'Payment Rule Details'
  const hasErrors = Object.keys(errors).length > 0

  return (
    <Modal
      title={title}
      size="xl"
      onClose={onClose}
      footer={readOnly ? (
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      ) : (
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={submit}>Save</Button>
        </>
      )}
    >
      <div className="space-y-5">
        <Section title="Rule">
          <div className="flex flex-col gap-1">
            <SelectField
              label="Rule Type *"
              value={data.ruleType}
              disabled={readOnly}
              onChange={(v) => set('ruleType', v as PaymentRuleType)}
              options={RULE_TYPE_OPTIONS}
            />
            {errors.ruleType && <p className="text-xs text-notion-red">{errors.ruleType}</p>}
          </div>
          <Input label="Name *" value={data.name} disabled={readOnly} error={errors.name} onChange={(e) => set('name', e.target.value)} />
          <Input label="Code *" value={data.code} disabled={readOnly} error={errors.code} onChange={(e) => set('code', e.target.value)} />
          <div className="col-span-2">
            <TextArea label="Description" rows={2} value={data.description} disabled={readOnly} onChange={(e) => set('description', e.target.value)} />
          </div>
        </Section>

        <Section title="Scope">
          <Input label="Tenant ID *" type="number" value={data.tenantId} disabled={readOnly} error={errors.tenantId} onChange={setNum('tenantId')} />
          <Input label="Branch ID" type="number" value={data.branchId} disabled={readOnly} onChange={setNum('branchId')} />
          <Input label="Rank" type="number" value={data.rank} disabled={readOnly} onChange={setNum('rank')} />
          <Input label="Context Type" type="number" value={data.contextType} disabled={readOnly} onChange={setNum('contextType')} />
          <Input label="Context ID" type="number" value={data.contextId} disabled={readOnly} onChange={setNum('contextId')} />
        </Section>

        <Section title="Classification">
          <Input label="Class 1" value={data.class1} disabled={readOnly} onChange={(e) => set('class1', e.target.value)} />
          <Input label="Class 2" value={data.class2} disabled={readOnly} onChange={(e) => set('class2', e.target.value)} />
        </Section>

        <Section title="Calculation">
          <div className="flex flex-col gap-1">
            <SelectField
              label="Calculation Type *"
              value={data.calculationType}
              disabled={readOnly}
              onChange={(v) => set('calculationType', v as PaymentCalculationType)}
              options={CALC_TYPE_OPTIONS}
            />
            {errors.calculationType && <p className="text-xs text-notion-red">{errors.calculationType}</p>}
          </div>
          <Input label="Calculation Value *" value={data.calculationValue} disabled={readOnly} error={errors.calculationValue} placeholder="Amount, percent, or formula" onChange={(e) => set('calculationValue', e.target.value)} />
        </Section>

        <Section title="Tax (optional)">
          <Input label="Tax Type" value={data.taxType} disabled={readOnly} onChange={(e) => set('taxType', e.target.value)} />
          <Input label="Tax Percentage" type="number" value={data.taxPercentage} disabled={readOnly} onChange={setNum('taxPercentage')} />
        </Section>

        <Section title="Effective Period">
          <div className="flex flex-col gap-1">
            <Label>Start Date</Label>
            <Input type="date" value={data.effectivePeriodStartDate} disabled={readOnly} onChange={(e) => set('effectivePeriodStartDate', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>End Date</Label>
            <Input type="date" value={data.effectivePeriodEndDate} disabled={readOnly} onChange={(e) => set('effectivePeriodEndDate', e.target.value)} />
          </div>
        </Section>

        <div className="flex items-center gap-2">
          <Label>Status</Label>
          <Toggle checked={data.isActive} disabled={readOnly} onChange={(v) => set('isActive', v)} />
          <span className="text-xs text-notion-sub">{data.isActive ? 'Active' : 'Inactive'}</span>
        </div>

        {hasErrors && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-notion-red">
            Please fix the highlighted fields before saving.
          </p>
        )}
      </div>
    </Modal>
  )
}
