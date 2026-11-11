import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{ resource: 'sub-categories', title: 'Inventory Sub-categories', singular: 'Sub-category', withCategory: true }}
    />
  )
}
