'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, Button, Badge, Modal } from '@/shared/ui'
import { copyToClipboard } from '@/shared/utils'
import { getTenantAdmin, resetTenantAdminPassword } from '../services/businesses.api'
import { formatBusinessDate } from '../utils'
import type { IAdminAccountTabProps, IResetCredentials } from '../interfaces'
import { SectionTitle } from './SectionTitle'
import { ReadField } from './ReadField'

export function AdminAccountTab({ tenantId, tenantName }: IAdminAccountTabProps) {
  const [resetCreds, setResetCreds] = useState<IResetCredentials | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { data: adminAccount, isLoading: adminLoading, refetch: refetchAdmin } = useQuery({
    queryKey: ['siteadmin', 'tenant-admin', tenantId],
    queryFn: () => getTenantAdmin(tenantId),
    enabled: !!tenantId,
  })

  const resetMutation = useMutation({
    mutationFn: () => resetTenantAdminPassword(tenantId),
    onSuccess: (data) => {
      // Keep the modal open and swap its body to show the new credentials so the
      // admin can copy the one-time password before closing.
      setResetCreds(data)
      refetchAdmin()
    },
  })

  function closeResetModal() {
    setResetConfirm(false)
    setResetCreds(null)
    resetMutation.reset()
  }

  async function handleCopy(text: string, field: string) {
    const ok = await copyToClipboard(text)
    if (!ok) return
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="px-5 py-4 border-b border-notion-line flex items-center justify-between">
          <SectionTitle>Business Admin Account</SectionTitle>
          {adminAccount && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setResetConfirm(true)}
              disabled={resetMutation.isPending}
            >
              Reset Password
            </Button>
          )}
        </div>

        <CardContent className="py-5">
          {adminLoading ? (
            <p className="text-sm text-notion-faint">Loading…</p>
          ) : !adminAccount ? (
            <p className="text-sm text-notion-faint">No admin account found for this business.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              <ReadField
                label="Name"
                value={[adminAccount.firstName, adminAccount.lastName].filter(Boolean).join(' ')}
              />
              <ReadField label="Platform MRN" value={adminAccount.platformMrn} />
              <ReadField label="Phone (login ID)" value={adminAccount.phone} />
              <ReadField label="Email" value={adminAccount.email} />
              <div>
                <p className="text-xs text-notion-sub mb-0.5">Password Status</p>
                {adminAccount.isTempPassword ? (
                  <Badge variant="warning">Temp Password — not changed yet</Badge>
                ) : (
                  <Badge variant="success">Password set by admin</Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-notion-sub mb-0.5">Account Status</p>
                <Badge variant={adminAccount.isActive ? 'success' : 'danger'}>
                  {adminAccount.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <ReadField
                label="Last Login"
                value={adminAccount.lastLoginAt ? formatBusinessDate(adminAccount.lastLoginAt) : null}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset password dialog — confirms, then shows the new credentials inline */}
      {resetConfirm && (
        <Modal
          title={resetCreds ? 'New credentials' : 'Reset business admin password?'}
          size="sm"
          onClose={closeResetModal}
          footer={
            resetCreds ? (
              <Button size="sm" onClick={closeResetModal}>
                Done
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={closeResetModal}
                  disabled={resetMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={resetMutation.isPending}
                  onClick={() => resetMutation.mutate()}
                >
                  Yes, Reset Password
                </Button>
              </>
            )
          }
        >
          {resetCreds ? (
            <div className="space-y-4">
              <p className="text-sm text-notion-sub">
                Share these credentials with the business admin. The password is shown once—it cannot be retrieved again.
              </p>

              <div className="rounded-lg bg-notion-panel border border-notion-line divide-y divide-notion-line">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs text-notion-sub mb-0.5">Phone (Login ID)</p>
                    <p className="text-sm font-mono text-notion-text">{resetCreds.adminPhone}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleCopy(resetCreds.adminPhone, 'phone')}
                  >
                    {copiedField === 'phone' ? '✓ Copied' : 'Copy'}
                  </Button>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs text-notion-sub mb-0.5">Temporary Password</p>
                    <p className="text-sm font-mono text-notion-text tracking-wider">{resetCreds.tempPassword}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleCopy(resetCreds.tempPassword, 'password')}
                  >
                    {copiedField === 'password' ? '✓ Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-notion-faint">
                Admin must change this password after first login.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-notion-sub">
                A new temporary password will be generated for <strong>{tenantName}</strong>.
              </p>
              {resetMutation.isError && (
                <p className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {(resetMutation.error as any)?.response?.data?.message ?? 'Failed to reset password'}
                </p>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
