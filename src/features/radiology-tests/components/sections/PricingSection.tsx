'use client'

import { Input } from '@/shared/ui'
import type { RadiologyTest } from '../../interfaces'
import { YesNoField } from '../controls'

/* ─── Pricing Section (radiology) ─── */
export function PricingSection({ data, set }: { data: RadiologyTest; set: (f: keyof RadiologyTest, v: unknown) => void }) {
  const num = (f: keyof RadiologyTest) => (e: React.ChangeEvent<HTMLInputElement>) => set(f, +e.target.value)
  return (
    <div className="grid grid-cols-3 gap-4">
      <Input label="Price MSRP" type="number" value={data.priceMSRP} onChange={num('priceMSRP')} />
      <Input label="Price Maximum" type="number" value={data.priceMax} onChange={num('priceMax')} />
      <Input label="Price Minimum" type="number" value={data.priceMin} onChange={num('priceMin')} />
      <Input label="Price Original" type="number" value={data.priceOriginal} onChange={num('priceOriginal')} />
      <Input label="Franchise Price" type="number" value={data.franchisePrice} onChange={num('franchisePrice')} />
      <Input label="Emergency Price" type="number" value={data.emergencyPrice} onChange={num('emergencyPrice')} />
      <Input label="Commission Price" type="number" value={data.commissionPrice} onChange={num('commissionPrice')} />
      <Input label="Discount Cap %" type="number" value={data.discountCap} onChange={num('discountCap')} />
      <YesNoField label="Allow Price Override" value={data.allowPriceOverride} onChange={x => set('allowPriceOverride', x)} />
    </div>
  )
}
