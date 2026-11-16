'use client'

import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{
        resource: 'categories',
        title: 'Inventory Categories',
        singular: 'Category',
        printBarcode: true,
        columns: [{ header: 'Code', cell: (r) => r.code ?? '—', width: 140 }],
        fields: [
          { key: 'code', label: 'Code', kind: 'text' },
          { key: 'name', label: 'Name', kind: 'text', required: true },
          { key: 'description', label: 'Description', kind: 'textarea' },
          { key: 'imageUrl', label: 'Image', kind: 'image' },
        ],
      }}
    />
  )
}
