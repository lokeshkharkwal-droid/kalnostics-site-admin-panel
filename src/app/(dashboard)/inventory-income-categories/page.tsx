'use client'

import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{
        resource: 'income-categories',
        title: 'Inventory Income Categories',
        singular: 'Income Category',
        columns: [
          { header: 'Code', cell: (r) => r.code ?? '—', width: 140 },
          { header: 'Tax Rate', cell: (r) => r.taxRate?.name ?? '—', width: 160 },
          { header: 'Tax Method', cell: (r) => r.taxMethod ?? '—', width: 140 },
        ],
        fields: [
          { key: 'code', label: 'Code', kind: 'text' },
          { key: 'name', label: 'Name', kind: 'text', required: true },
          {
            key: 'taxRateId',
            label: 'Tax rate',
            kind: 'reference',
            referenceResource: 'tax-rates',
            referenceRelationKey: 'taxRate',
          },
          {
            key: 'taxMethod',
            label: 'Tax method',
            kind: 'select',
            defaultValue: 'EXCLUSIVE',
            options: [
              { value: 'INCLUSIVE', label: 'Inclusive' },
              { value: 'EXCLUSIVE', label: 'Exclusive' },
            ],
          },
        ],
      }}
    />
  )
}
