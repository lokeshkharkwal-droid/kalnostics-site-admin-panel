'use client'

import { Button, Badge, DataTable, type Column } from '@/shared/ui'
import type { AuthRole, IAuthRolesTableProps } from '../interfaces'

export function AuthRolesTable({ roles, onView, onEdit }: IAuthRolesTableProps) {
  const columns: Column<AuthRole>[] = [
    {
      header: 'Role Name',
      width: 260,
      tooltip: r => `${r.name} · ${r.key}`,
      cell: r => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="truncate font-medium text-notion-text">{r.name}</span>
            {r.isSystem && <Badge variant="default">Built-in</Badge>}
          </div>
          <p className="truncate text-xs text-notion-faint">{r.key}</p>
        </div>
      ),
    },
    {
      header: 'Description',
      width: 360,
      tooltip: r => r.description ?? '',
      cell: r => (
        <span className="text-sm text-notion-sub">{r.description || '—'}</span>
      ),
    },
    {
      header: 'Status',
      width: 120,
      truncate: false,
      cell: r =>
        r.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="default">Inactive</Badge>
        ),
    },
  ]

  return (
    <DataTable
      rows={roles}
      rowKey={r => r.id}
      columns={columns}
      emptyMessage="No roles found"
      actionsWidth={160}
      actions={role => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-notion-sub hover:text-notion-text"
            onClick={() => onView(role)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-notion-sub hover:text-notion-text"
            onClick={() => onEdit(role)}
          >
            Edit
          </Button>
        </div>
      )}
    />
  )
}
