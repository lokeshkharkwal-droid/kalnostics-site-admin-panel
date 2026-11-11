import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return <ReferenceCrudPage config={{ resource: 'units', title: 'Inventory Units', singular: 'Unit' }} />
}
