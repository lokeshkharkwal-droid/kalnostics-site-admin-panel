'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Button, RadioGroup, Spinner } from '@/shared/ui'
import type { TenantSetting } from '@/entities/tenant'
import { getTenantSettings, updateTenantSettings } from '../services/businesses.api'
import type { ISettingsForm } from '../interfaces'

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const COMMISSION = [
  { value: 'EXCLUSIVE', label: 'Exclusive' },
  { value: 'INCLUSIVE', label: 'Inclusive' },
]

const yn = (b: boolean): 'yes' | 'no' => (b ? 'yes' : 'no')

function toForm(s: TenantSetting): ISettingsForm {
  return {
    isExternalDoctorOutReferralAllowed: s.isExternalDoctorOutReferralAllowed,
    isExternalDoctorInReferralAllowed: s.isExternalDoctorInReferralAllowed,
    isExternalHospitalOutReferralAllowed: s.isExternalHospitalOutReferralAllowed,
    isExternalHospitalInReferralAllowed: s.isExternalHospitalInReferralAllowed,
    isPatientOrderPaymentAllowed: s.isPatientOrderPaymentAllowed,
    isCmsOrderBillGenerationEnabled: s.isCmsOrderBillGenerationEnabled,
    referralPgCommissionType: s.referralPgCommissionType,
    patientPgCommissionType: s.patientPgCommissionType,
    franchiseBranchPgCommissionType: s.franchiseBranchPgCommissionType,
    canPatientWalletGoNegative: s.canPatientWalletGoNegative,
  }
}

/**
 * Business Settings modal — referral / payment / commission / wallet rules.
 * Self-contained; opens from both the businesses list and the detail page.
 */
export function SettingsModal({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<ISettingsForm | null>(null)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['siteadmin', 'tenant-settings', tenantId],
    queryFn: () => getTenantSettings(tenantId),
    enabled: !!tenantId,
  })

  useEffect(() => {
    if (data) setForm(toForm(data))
  }, [data])

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => updateTenantSettings(tenantId, body),
    onSuccess: (updated) => {
      qc.setQueryData(['siteadmin', 'tenant-settings', tenantId], updated)
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to save settings'
      setError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function setBool<K extends keyof ISettingsForm>(key: K, v: string) {
    setForm((f) => (f ? { ...f, [key]: v === 'yes' } : f))
  }
  function setEnum<K extends keyof ISettingsForm>(key: K, v: string) {
    setForm((f) => (f ? { ...f, [key]: v } : f))
  }

  function handleSave() {
    if (!form) return
    setError('')
    mutation.mutate({ ...form })
  }

  return (
    <Modal
      title="Business Settings"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button size="sm" loading={mutation.isPending} onClick={handleSave} disabled={!form}>
            Save Settings
          </Button>
        </>
      }
    >
      {isLoading || !form ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Referral Settings */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">Referral Settings</p>
            <RadioGroup name="ext-doc-out" label="Allow external doctors/practices for Out Referrals"
              options={YES_NO} value={yn(form.isExternalDoctorOutReferralAllowed)}
              onChange={(v) => setBool('isExternalDoctorOutReferralAllowed', v)} disabled={mutation.isPending} />
            <RadioGroup name="ext-doc-in" label="Allow external doctors/practices for In Referrals"
              options={YES_NO} value={yn(form.isExternalDoctorInReferralAllowed)}
              onChange={(v) => setBool('isExternalDoctorInReferralAllowed', v)} disabled={mutation.isPending} />
            <RadioGroup name="ext-hosp-out" label="Allow external hospitals for Out Referrals"
              options={YES_NO} value={yn(form.isExternalHospitalOutReferralAllowed)}
              onChange={(v) => setBool('isExternalHospitalOutReferralAllowed', v)} disabled={mutation.isPending} />
            <RadioGroup name="ext-hosp-in" label="Allow external hospitals for In Referrals"
              options={YES_NO} value={yn(form.isExternalHospitalInReferralAllowed)}
              onChange={(v) => setBool('isExternalHospitalInReferralAllowed', v)} disabled={mutation.isPending} />
          </section>

          {/* Payment Settings */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">Payment Settings</p>
            <RadioGroup name="patient-pay" label="Allow Order Payment by Patient"
              options={YES_NO} value={yn(form.isPatientOrderPaymentAllowed)}
              onChange={(v) => setBool('isPatientOrderPaymentAllowed', v)} disabled={mutation.isPending} />
            <RadioGroup name="cms-bill" label="CMS Order Bill Generate Option"
              options={YES_NO} value={yn(form.isCmsOrderBillGenerationEnabled)}
              onChange={(v) => setBool('isCmsOrderBillGenerationEnabled', v)} disabled={mutation.isPending} />
          </section>

          {/* Commission Types */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">Commission Types</p>
            <RadioGroup name="referral-comm" label="Business Referral Online Payment Gateway Commission Type"
              options={COMMISSION} value={form.referralPgCommissionType}
              onChange={(v) => setEnum('referralPgCommissionType', v)} disabled={mutation.isPending} />
            <RadioGroup name="patient-comm" label="Business Patient Online Payment Gateway Commission Type"
              options={COMMISSION} value={form.patientPgCommissionType}
              onChange={(v) => setEnum('patientPgCommissionType', v)} disabled={mutation.isPending} />
            <RadioGroup name="franchise-comm" label="Business Franchise Branch Online Payment Gateway Commission Type"
              options={COMMISSION} value={form.franchiseBranchPgCommissionType}
              onChange={(v) => setEnum('franchiseBranchPgCommissionType', v)} disabled={mutation.isPending} />
          </section>

          {/* Wallet Settings */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">Wallet Settings</p>
            <RadioGroup name="wallet-neg" label="Can the Patient Wallet Amount Go Negative?"
              options={YES_NO} value={yn(form.canPatientWalletGoNegative)}
              onChange={(v) => setBool('canPatientWalletGoNegative', v)} disabled={mutation.isPending} />
          </section>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      )}
    </Modal>
  )
}
