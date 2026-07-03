'use client'

import { Button, Badge, DataTable, type Column } from '@/shared/ui'
import type { RegisteredUser, IRegisteredUsersTableProps } from '../interfaces'

export function RegisteredUsersTable({ users, onView }: IRegisteredUsersTableProps) {
  const columns: Column<RegisteredUser>[] = [
    {
      header: 'Username',
      width: 240,
      tooltip: u => u.username ?? '',
      cell: u => (
        <div>
          <span className="truncate font-medium text-notion-text">
            {u.username || '—'}
          </span>
          {u.name && <p className="truncate text-xs text-notion-faint">{u.name}</p>}
        </div>
      ),
    },
    {
      header: 'Email',
      width: 300,
      tooltip: u => u.email ?? '',
      cell: u => <span className="text-sm text-notion-sub">{u.email || '—'}</span>,
    },
    {
      header: 'User Type',
      width: 130,
      truncate: false,
      cell: u =>
        u.userType === 'STAFF' ? (
          <Badge variant="default">Staff</Badge>
        ) : (
          <Badge variant="default">Patient</Badge>
        ),
    },
    {
      header: 'Status',
      width: 120,
      truncate: false,
      cell: u =>
        u.status === 'ACTIVE' ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="default">Inactive</Badge>
        ),
    },
  ]

  return (
    <DataTable
      rows={users}
      rowKey={u => u.id}
      columns={columns}
      emptyMessage="No users found"
      actionsWidth={100}
      actions={user => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-notion-sub hover:text-notion-text"
            onClick={() => onView(user)}
          >
            View
          </Button>
        </div>
      )}
    />
  )
}
