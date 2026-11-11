import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{ resource: 'categories', title: 'Inventory Categories', singular: 'Category', withDescription: true }}
    />
  )
}
