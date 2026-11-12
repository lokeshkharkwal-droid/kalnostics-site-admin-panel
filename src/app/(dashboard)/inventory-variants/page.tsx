import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{
        resource: 'variants',
        title: 'Inventory Variants',
        singular: 'Variant',
        fields: [{ key: 'name', label: 'Name', kind: 'text', required: true }],
      }}
    />
  )
}

export const dynamic = 'force-dynamic'
