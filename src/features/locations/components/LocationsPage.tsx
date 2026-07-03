'use client'

import { useState } from 'react'
import { AdminHeader } from '@/widgets/AdminHeader'
import { cn } from '@/shared/utils'
import { CountriesTab } from './CountriesTab'
import { StatesTab } from './StatesTab'
import { CitiesTab } from './CitiesTab'
import { AreasTab } from './AreasTab'

type LocationTab = 'countries' | 'states' | 'cities' | 'areas'

const TABS: { key: LocationTab; label: string }[] = [
  { key: 'countries', label: 'Countries' },
  { key: 'states', label: 'States' },
  { key: 'cities', label: 'Cities' },
  { key: 'areas', label: 'Areas' },
]

/**
 * Location master — one page, four tabs (Countries → States → Cities → Areas).
 * Each tab is a self-contained CRUD screen (table, filters, forms). Platform-level
 * global reference data managed by Site Admin.
 */
export function LocationsPage() {
  const [activeTab, setActiveTab] = useState<LocationTab>('countries')

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Locations"
        subtitle="Global Country → State → City → Area reference data"
      />

      <main className="flex-1 space-y-4 p-6">
        <div className="flex border-b border-notion-line">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-notion-blue text-notion-blue'
                  : 'border-transparent text-notion-sub hover:text-notion-text',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'countries' && <CountriesTab />}
        {activeTab === 'states' && <StatesTab />}
        {activeTab === 'cities' && <CitiesTab />}
        {activeTab === 'areas' && <AreasTab />}
      </main>
    </div>
  )
}
