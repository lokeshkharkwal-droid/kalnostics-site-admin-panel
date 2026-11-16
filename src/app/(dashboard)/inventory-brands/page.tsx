'use client'

import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{
        resource: 'brands',
        title: 'Inventory Brands',
        singular: 'Brand',
        columns: [{ header: 'Code', cell: (r) => r.code ?? '—', width: 140 }],
        fields: [
          { key: 'code', label: 'Code', kind: 'text' },
          { key: 'name', label: 'Name', kind: 'text', required: true },
        ],
      }}
    />
  )
}
