import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return <ReferenceCrudPage config={{ resource: 'brands', title: 'Inventory Brands', singular: 'Brand' }} />
}
