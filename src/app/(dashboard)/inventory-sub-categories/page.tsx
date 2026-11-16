'use client'

import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{
        resource: 'sub-categories',
        title: 'Inventory Sub-categories',
        singular: 'Sub-category',
        columns: [
          { header: 'Category', cell: (r) => r.category?.name ?? '—', width: 180 },
          { header: 'Code', cell: (r) => r.code ?? '—', width: 140 },
        ],
        fields: [
          {
            key: 'categoryId',
            label: 'Parent category',
            kind: 'reference',
            required: true,
            referenceResource: 'categories',
            referenceRelationKey: 'category',
          },
          { key: 'code', label: 'Code', kind: 'text' },
          { key: 'name', label: 'Name', kind: 'text', required: true },
        ],
      }}
    />
  )
}
