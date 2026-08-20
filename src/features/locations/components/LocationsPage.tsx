'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/utils'
import { syncIndiaLocationData } from '../services/locations.api'
import type { SyncIndiaResult } from '../interfaces'
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

/** All location query keys (lists + parent name-maps + option dropdowns) share
 *  this root, so invalidating it refreshes every tab after a sync. */
const LOCATION_QUERY_KEYS = [
  ['siteadmin', 'countries'],
  ['siteadmin', 'states'],
  ['siteadmin', 'cities'],
  ['siteadmin', 'areas'],
  ['siteadmin', 'country-name-map'],
  ['siteadmin', 'state-name-map'],
  ['siteadmin', 'city-name-map'],
  ['siteadmin', 'country-options'],
  ['siteadmin', 'state-options'],
  ['siteadmin', 'city-options'],
] as const

/** Human-readable one-line summary of a sync run. */
function summarize(r: SyncIndiaResult): string {
  const tier = (label: string, t: { created: number; existing: number }) =>
    `${t.created} ${label} added${t.existing ? `, ${t.existing} existing` : ''}`
  return [
    tier('country', r.countries),
    tier('states/UTs', r.states),
    tier('cities', r.cities),
  ].join(' · ')
}

/**
 * Location master — one page, four tabs (Countries → States → Cities → Areas).
 * Each tab is a self-contained CRUD screen (table, filters, forms). Platform-level
 * global reference data managed by Site Admin. A one-click "Import India Locations"
 * action (rendered inline beside each tab's Add button) imports the bundled India
 * master idempotently.
 */
export function LocationsPage() {
  const [activeTab, setActiveTab] = useState<LocationTab>('countries')
  const qc = useQueryClient()

  const syncMut = useMutation({
    mutationFn: syncIndiaLocationData,
    onSuccess: (result) => {
      for (const key of LOCATION_QUERY_KEYS) {
        qc.invalidateQueries({ queryKey: key })
      }
      toast.success(`India locations imported — ${summarize(result)}`)
    },
    // Errors surface via the shared Axios error toast (KaltrosException message).
  })

  // Rendered inside each tab's toolbar, immediately to the left of its Add button.
  const syncButton = (
    <Button
      size="sm"
      variant="secondary"
      loading={syncMut.isPending}
      disabled={syncMut.isPending}
      onClick={() => syncMut.mutate()}
    >
      {syncMut.isPending ? 'Importing India Locations…' : 'Import India Locations'}
    </Button>
  )

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

        {activeTab === 'countries' && <CountriesTab syncSlot={syncButton} />}
        {activeTab === 'states' && <StatesTab syncSlot={syncButton} />}
        {activeTab === 'cities' && <CitiesTab syncSlot={syncButton} />}
        {activeTab === 'areas' && <AreasTab />}
      </main>
    </div>
  )
}
