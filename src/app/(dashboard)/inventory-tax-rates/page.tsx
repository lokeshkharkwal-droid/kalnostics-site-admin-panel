'use client'

import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{
        resource: 'tax-rates',
        title: 'Inventory Tax Rates',
        singular: 'Tax Rate',
        columns: [
          { header: 'Code', cell: (r) => r.code ?? '—', width: 120 },
          { header: 'Rate', cell: (r) => (r.rate != null ? `${r.rate}%` : '—'), width: 100 },
          { header: 'Type', cell: (r) => r.type ?? '—', width: 140 },
        ],
        fields: [
          { key: 'name', label: 'Name', kind: 'text', required: true },
          { key: 'code', label: 'Code', kind: 'text', required: true },
          { key: 'rate', label: 'Rate %', kind: 'number', placeholder: '18' },
          {
            key: 'type',
            label: 'Type',
            kind: 'select',
            defaultValue: 'percentage',
            options: [
              { value: 'percentage', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed' },
            ],
          },
          { key: 'hsnCode', label: 'HSN Code', kind: 'text' },
          { key: 'cgst', label: 'CGST %', kind: 'number', placeholder: '9' },
          { key: 'sgst', label: 'SGST %', kind: 'number', placeholder: '9' },
          { key: 'igst', label: 'IGST %', kind: 'number', placeholder: '18' },
        ],
      }}
    />
  )
}
