import { ReferenceCrudPage } from '@/features/inventory-reference'

export default function Page() {
  return (
    <ReferenceCrudPage
      config={{ resource: 'tax-rates', title: 'Inventory Tax Rates', singular: 'Tax Rate', withRate: true }}
    />
  )
}
