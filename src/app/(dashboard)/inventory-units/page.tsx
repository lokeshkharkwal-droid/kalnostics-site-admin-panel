'use client'

import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{
        resource: 'units',
        title: 'Inventory Units',
        singular: 'Unit',
        columns: [{ header: 'Code', cell: (r) => r.code ?? '—', width: 140 }],
        fields: [
          { key: 'code', label: 'Code', kind: 'text', required: true },
          { key: 'name', label: 'Name', kind: 'text', required: true },
        ],
      }}
    />
  )
}
