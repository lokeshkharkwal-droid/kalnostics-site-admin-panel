'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'

type SiteAdminRole = 'content_admin' | 'operations_admin' | 'full_admin' | 'super_owner'

interface SiteAdminUser {
  id: string
  firstName: string
  lastName: string | null
  email: string
  role: SiteAdminRole
  isActive: boolean
  lastLoginAt: string | null
  lastLoginIp: string | null
  createdAt: string
}

interface CreateAdminForm {
  firstName: string
  lastName: string
  email: string
  password: string
  role: SiteAdminRole
}

const ROLE_LABEL: Record<SiteAdminRole, string> = {
  content_admin:    'Content Admin',
  operations_admin: 'Operations Admin',
  full_admin:       'Full Admin',
  super_owner:      'Super Owner',
}

const ROLE_VARIANT: Record<SiteAdminRole, 'default' | 'info' | 'warning' | 'danger'> = {
  content_admin:    'default',
  operations_admin: 'info',
  full_admin:       'warning',
  super_owner:      'danger',
}

// Roles available when creating a sub-admin (super_owner cannot be created via API)
const CREATABLE_ROLES: SiteAdminRole[] = ['content_admin', 'operations_admin', 'full_admin']

const INITIAL_FORM: CreateAdminForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'operations_admin',
}

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateAdminForm>(INITIAL_FORM)
  const [formError, setFormError] = useState('')
  const [confirmDeactivate, setConfirmDeactivate] = useState<SiteAdminUser | null>(null)
  const [confirmActivate, setConfirmActivate] = useState<SiteAdminUser | null>(null)
  const [changePasswordFor, setChangePasswordFor] = useState<SiteAdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [roleFilter, setRoleFilter] = useState<SiteAdminRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'deactivated' | ''>('')

  const { data: allAdmins = [], isLoading } = useQuery({
    queryKey: ['siteadmin', 'users'],
    queryFn: async () => {
      const res = await api.get<SiteAdminUser[]>('/api/v1/siteadmin/users')
      const list = res.data as SiteAdminUser[]
      // Backend emits role as an UPPERCASE Prisma enum (e.g. "SUPER_OWNER");
      // this UI keys its role maps in lowercase. Normalise on the way in.
      return list.map(a => ({ ...a, role: a.role.toLowerCase() as SiteAdminRole }))
    },
  })

  const admins = useMemo(() => {
    let result = allAdmins
    if (roleFilter) {
      result = result.filter(a => a.role === roleFilter)
    }
    if (statusFilter === 'active') {
      result = result.filter(a => a.isActive)
    } else if (statusFilter === 'deactivated') {
      result = result.filter(a => !a.isActive)
    }
    return result
  }, [allAdmins, roleFilter, statusFilter])

  const createMutation = useMutation({
    mutationFn: (body: CreateAdminForm) =>
      // Backend validates role against the UPPERCASE Prisma enum, so send it
      // uppercased (the UI works in lowercase internally).
      api.post('/api/v1/siteadmin/users', { ...body, role: body.role.toUpperCase() }, { successMessage: 'Admin account created' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'users'] })
      setShowCreate(false)
      setForm(INITIAL_FORM)
      setFormError('')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create admin account'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (adminId: string) =>
      api.patch(`/api/v1/siteadmin/users/${adminId}/deactivate`, undefined, { successMessage: 'Admin account deactivated' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'users'] })
      setConfirmDeactivate(null)
    },
    // Success and failure snackbars are handled globally by the api interceptor.
  })

  const activateMutation = useMutation({
    mutationFn: (adminId: string) =>
      api.patch(`/api/v1/siteadmin/users/${adminId}/activate`, undefined, { successMessage: 'Admin account activated' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'users'] })
      setConfirmActivate(null)
    },
    // Success and failure snackbars are handled globally by the api interceptor.
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ adminId, password }: { adminId: string; password: string }) =>
      api.patch(`/api/v1/siteadmin/users/${adminId}/password`, { newPassword: password }, { successMessage: 'Password updated' }).then(r => r.data),
    onSuccess: () => {
      setChangePasswordFor(null)
      setNewPassword('')
      setPasswordError('')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to change password'
      setPasswordError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    if (!newPassword.trim()) { setPasswordError('New password is required'); return }
    if (!changePasswordFor) return
    changePasswordMutation.mutate({ adminId: changePasswordFor.id, password: newPassword })
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.firstName.trim()) { setFormError('First name is required'); return }
    if (!form.email.trim())     { setFormError('Email is required'); return }
    if (!form.password.trim())  { setFormError('Password is required'); return }
    createMutation.mutate(form)
  }

  function formatLastLogin(admin: SiteAdminUser) {
    if (!admin.lastLoginAt) return 'Never'
    const date = new Date(admin.lastLoginAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
    return admin.lastLoginIp ? `${date} · ${admin.lastLoginIp}` : date
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Admin Users"
        subtitle="Manage SiteAdmin accounts and their role access"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + New Admin
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as SiteAdminRole | '')}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Roles</option>
            {(Object.keys(ROLE_LABEL) as SiteAdminRole[]).map(role => (
              <option key={role} value={role}>{ROLE_LABEL[role]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'active' | 'deactivated' | '')}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
          {(roleFilter || statusFilter) && (
            <button
              onClick={() => { setRoleFilter(''); setStatusFilter('') }}
              className="text-xs text-notion-faint hover:text-notion-sub"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-notion-faint">
            {admins.length} of {allAdmins.length} accounts
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <PageLoader />
            ) : admins.length === 0 ? (
              <div className="py-16 text-center text-sm text-notion-faint">
                {(roleFilter || statusFilter) ? 'No accounts match the selected filters' : 'No admin accounts found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-notion-line bg-notion-panel/50">
                      <th className="px-5 py-3 text-left text-xs font-medium text-notion-sub uppercase tracking-wide">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-notion-sub uppercase tracking-wide">Role</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-notion-sub uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-notion-sub uppercase tracking-wide">Last Login</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-notion-sub uppercase tracking-wide">Created</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr key={admin.id} className="border-b border-notion-panel hover:bg-notion-panel/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-notion-text">
                            {admin.firstName} {admin.lastName ?? ''}
                          </p>
                          <p className="text-xs text-notion-faint">{admin.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={ROLE_VARIANT[admin.role]}>
                            {ROLE_LABEL[admin.role]}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          {admin.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="default">Deactivated</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-notion-sub">
                          {formatLastLogin(admin)}
                        </td>
                        <td className="px-5 py-3 text-xs text-notion-sub">
                          {new Date(admin.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-notion-sub hover:text-notion-text"
                              onClick={() => { setChangePasswordFor(admin); setNewPassword(''); setPasswordError('') }}
                            >
                              Change Password
                            </Button>
                            {/* super_owner cannot be deactivated */}
                            {admin.role !== 'super_owner' && admin.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setConfirmDeactivate(admin)}
                              >
                                Deactivate
                              </Button>
                            )}
                            {admin.role !== 'super_owner' && !admin.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => setConfirmActivate(admin)}
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create admin modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-notion-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
              <h2 className="text-sm font-semibold text-notion-text">Create Admin Account</h2>
              <button
                onClick={() => { setShowCreate(false); setFormError('') }}
                className="text-notion-faint hover:text-notion-sub transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="Priya"
                  disabled={createMutation.isPending}
                />
                <Input
                  label="Last Name"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Kumar"
                  disabled={createMutation.isPending}
                />
              </div>

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="priya@kaltros.com"
                disabled={createMutation.isPending}
              />

              <PasswordInput
                label="Password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                disabled={createMutation.isPending}
              />

              <div>
                <label className="block text-xs font-medium text-notion-text mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as SiteAdminRole }))}
                  disabled={createMutation.isPending}
                  className="w-full rounded-md border border-notion-line2 bg-white px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
                >
                  {CREATABLE_ROLES.map(role => (
                    <option key={role} value={role}>{ROLE_LABEL[role]}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-notion-faint">
                  {form.role === 'content_admin' && 'Master data only: tests, templates, equipment'}
                  {form.role === 'operations_admin' && 'Content + business management, audit logs'}
                  {form.role === 'full_admin' && 'Operations + finance reports'}
                </p>
              </div>

              {formError && (
                <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowCreate(false); setFormError('') }}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={createMutation.isPending}>
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {changePasswordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-notion-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-notion-text">Change Password</h2>
                <p className="text-xs text-notion-faint mt-0.5">
                  {changePasswordFor.firstName} {changePasswordFor.lastName} · {changePasswordFor.email}
                </p>
              </div>
              <button
                onClick={() => { setChangePasswordFor(null); setPasswordError('') }}
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
                  onClick={() => { setChangePasswordFor(null); setPasswordError('') }}
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
      )}

      {/* Deactivate confirmation modal */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-notion-line bg-white shadow-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-notion-text">Deactivate Admin Account?</h2>
            <p className="text-sm text-notion-sub">
              This will revoke access for{' '}
              <strong>{confirmDeactivate.firstName} {confirmDeactivate.lastName}</strong>{' '}
              ({confirmDeactivate.email}). They will not be able to log in.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDeactivate(null)}
                disabled={deactivateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deactivateMutation.isPending}
                onClick={() => deactivateMutation.mutate(confirmDeactivate.id)}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activate confirmation modal */}
      {confirmActivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-notion-line bg-white shadow-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-notion-text">Activate Admin Account?</h2>
            <p className="text-sm text-notion-sub">
              This will restore access for{' '}
              <strong>{confirmActivate.firstName} {confirmActivate.lastName}</strong>{' '}
              ({confirmActivate.email}). They will be able to log in again.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmActivate(null)}
                disabled={activateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={activateMutation.isPending}
                onClick={() => activateMutation.mutate(confirmActivate.id)}
              >
                Activate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
