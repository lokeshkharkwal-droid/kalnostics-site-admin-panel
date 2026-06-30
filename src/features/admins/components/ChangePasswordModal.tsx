'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, PasswordInput } from '@/shared/ui'
import { changeAdminPassword } from '../services/admins.api'
import type { IChangePasswordModalProps } from '../interfaces'

export function ChangePasswordModal({ admin, onClose }: IChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: (password: string) => changeAdminPassword(admin.id, password),
    onSuccess: onClose,
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to change password'
      setPasswordError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    if (!newPassword.trim()) { setPasswordError('New password is required'); return }
    changePasswordMutation.mutate(newPassword)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-notion-text">Change Password</h2>
            <p className="text-xs text-notion-faint mt-0.5">
              {admin.firstName} {admin.lastName} · {admin.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-notion-faint hover:text-notion-sub transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 px-5 py-4">
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            hint="Password policy: min 8 characters, at least 1 uppercase letter and 1 number"
            disabled={changePasswordMutation.isPending}
          />

          {passwordError && (
            <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {passwordError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={changePasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={changePasswordMutation.isPending}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
