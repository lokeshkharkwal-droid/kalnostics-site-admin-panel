'use client'

import { Button, Badge, DataTable, type Column } from '@/shared/ui'
import { ROLE_LABEL, ROLE_VARIANT } from '@/entities/siteadmin-user'
import { formatLastLogin } from '../utils'
import type { IAdminsTableProps } from '../interfaces'

type AdminRow = IAdminsTableProps['admins'][number]

export function AdminsTable({ admins, onChangePassword, onDeactivate, onActivate }: IAdminsTableProps) {
  const columns: Column<AdminRow>[] = [
    {
      header: 'Name', width: 240,
      tooltip: a => `${a.firstName} ${a.lastName ?? ''} · ${a.email}`,
      cell: a => (
        <div>
          <p className="truncate font-medium text-notion-text">{a.firstName} {a.lastName ?? ''}</p>
          <p className="truncate text-xs text-notion-faint">{a.email}</p>
        </div>
      ),
    },
    {
      header: 'Role', width: 150, truncate: false,
      cell: a => <Badge variant={ROLE_VARIANT[a.role]}>{ROLE_LABEL[a.role]}</Badge>,
    },
    {
      header: 'Status', width: 130, truncate: false,
      cell: a => a.isActive
        ? <Badge variant="success">Active</Badge>
        : <Badge variant="default">Deactivated</Badge>,
    },
    {
      header: 'Last Login', width: 160,
      cell: a => <span className="text-xs text-notion-sub">{formatLastLogin(a)}</span>,
    },
    {
      header: 'Created', width: 130,
      cell: a => <span className="text-xs text-notion-sub">{new Date(a.createdAt).toLocaleDateString('en-IN')}</span>,
    },
  ]

  return (
    <DataTable
      rows={admins}
      rowKey={a => a.id}
      columns={columns}
      emptyMessage="No admins found"
      actionsWidth={280}
      actions={admin => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-notion-sub hover:text-notion-text"
            onClick={() => onChangePassword(admin)}
          >
            Change Password
          </Button>
          {/* super_owner cannot be deactivated */}
          {admin.role !== 'super_owner' && admin.isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={() => onDeactivate(admin)}
            >
              Deactivate
            </Button>
          )}
          {admin.role !== 'super_owner' && !admin.isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => onActivate(admin)}
            >
              Activate
            </Button>
          )}
        </div>
      )}
    />
  )
}
