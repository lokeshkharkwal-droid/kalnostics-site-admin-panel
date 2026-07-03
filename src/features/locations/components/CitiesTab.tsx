'use client'

import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge, Button, Card, CardContent, DataTable, Input, Modal, PageLoader, PaginatedSelect, Toggle,
  type Column, type SelectOption,
} from '@/shared/ui'
import { EyeIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import type { CityListRow } from '@/entities/location'
import type { City, FormMode } from '../interfaces'
import { emptyCity } from '../utils/constants'
import { cityFromEntity, cityToWriteDto } from '../utils/mapping'
import {
  createCity, deleteCity, fetchCountryNameMap, fetchCountryOptionsPage, fetchStateNameMap,
  fetchStateOptionsPage, getCity, listCities, updateCity,
} from '../services/locations.api'
import { CityFormModal } from './CityFormModal'

const LIMIT = 20
const QK = ['siteadmin', 'cities'] as const

/** Cities tab — table, name search + Country→State dependent filters. */
export function CitiesTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState<SelectOption | null>(null)
  const [stateFilter, setStateFilter] = useState<SelectOption | null>(null)
  const [form, setForm] = useState<{ city: City; mode: FormMode } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch, countryFilter, stateFilter])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, search: debouncedSearch, countryId: countryFilter?.id ?? null, stateId: stateFilter?.id ?? null }],
    queryFn: () => listCities({ page, limit: LIMIT, search: debouncedSearch, countryId: countryFilter?.id, stateId: stateFilter?.id }),
    placeholderData: keepPreviousData,
  })

  const { data: countryNameMap = {} } = useQuery({
    queryKey: ['siteadmin', 'country-name-map'], queryFn: fetchCountryNameMap, staleTime: 60_000,
  })
  const { data: stateNameMap = {} } = useQuery({
    queryKey: ['siteadmin', 'state-name-map'], queryFn: fetchStateNameMap, staleTime: 60_000,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: QK })
    qc.invalidateQueries({ queryKey: ['siteadmin', 'city-name-map'] })
    qc.invalidateQueries({ queryKey: ['siteadmin', 'city-options'] })
  }

  const saveMut = useMutation({
    mutationFn: ({ city, mode }: { city: City; mode: FormMode }) =>
      mode === 'create' ? createCity(cityToWriteDto(city)) : updateCity(city.id, cityToWriteDto(city)),
    onSuccess: () => { invalidate(); setForm(null) },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => updateCity(id, { isActive: next }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: deleteCity,
    onSuccess: () => { invalidate(); setConfirmDelete(null) },
  })

  const stateName = (r: CityListRow) => stateNameMap[r.stateId] ?? r.stateId
  const countryName = (r: CityListRow) => countryNameMap[r.countryId] ?? r.countryId

  const openForm = async (id: string, mode: 'edit' | 'view') => {
    try {
      const full = await getCity(id)
      setForm({ city: cityFromEntity(full, (c) => countryNameMap[c] ?? c, (s) => stateNameMap[s] ?? s), mode })
    } catch { /* error toast handled globally */ }
  }

  const columns: Column<CityListRow>[] = [
    { header: 'S.No.', width: 64, resizable: false, truncate: false,
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span> },
    { header: 'City Name', width: 200, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span> },
    { header: 'PIN Code', width: 120,
      cell: r => <span className="font-mono text-xs text-notion-blue">{r.pinCode}</span> },
    { header: 'State', width: 180, tooltip: stateName,
      cell: r => <span className="text-notion-sub">{stateName(r)}</span> },
    { header: 'Country', width: 180, tooltip: countryName,
      cell: r => <span className="text-notion-sub">{countryName(r)}</span> },
    { header: 'Status', width: 120, truncate: false,
      cell: r => <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-56">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-notion-faint">
            <SearchIcon className="h-4 w-4" />
          </span>
          <Input className="pl-8" placeholder="Search city name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <PaginatedSelect
            value={countryFilter}
            onChange={(opt) => { setCountryFilter(opt); setStateFilter(null) }}
            queryKey={['siteadmin', 'country-options']}
            fetchPage={fetchCountryOptionsPage}
            placeholder="Filter by country"
            emptyText="No countries"
          />
        </div>
        <div className="w-48">
          <PaginatedSelect
            value={stateFilter}
            onChange={setStateFilter}
            queryKey={['siteadmin', 'state-options', countryFilter?.id ?? null]}
            fetchPage={(p) => fetchStateOptionsPage({ ...p, countryId: countryFilter?.id })}
            placeholder={countryFilter ? 'Filter by state' : 'Select a country first'}
            emptyText="No states"
            disabled={!countryFilter}
          />
        </div>
        {(search || countryFilter || stateFilter) && (
          <button onClick={() => { setSearch(''); setCountryFilter(null); setStateFilter(null) }} className="text-xs text-notion-faint hover:text-notion-sub">Clear filters</button>
        )}
        <span className="ml-auto text-xs text-notion-faint">{total} {total === 1 ? 'city' : 'cities'}</span>
        <Button size="sm" onClick={() => setForm({ city: emptyCity(), mode: 'create' })}>
          <PlusIcon className="h-3.5 w-3.5" /> Add City
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent><PageLoader /></CardContent></Card>
      ) : (
        <DataTable
          rows={rows}
          rowKey={r => r.id}
          columns={columns}
          loading={isFetching}
          startIndex={(page - 1) * LIMIT}
          emptyMessage="No cities found"
          pagination={{ page, totalPages, total, limit: LIMIT, onPageChange: setPage }}
          actions={r => (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => openForm(r.id, 'view')} title="View" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><EyeIcon className="h-4 w-4" /></button>
              <button type="button" onClick={() => openForm(r.id, 'edit')} title="Edit" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><PencilIcon className="h-4 w-4" /></button>
              <button type="button" onClick={() => setConfirmDelete(r.id)} title="Delete" className="rounded p-1.5 text-notion-red hover:bg-notion-hover"><TrashIcon className="h-4 w-4" /></button>
              <span className="mx-1 h-4 w-px bg-notion-line" />
              <Toggle checked={r.isActive} onChange={() => toggleMut.mutate({ id: r.id, next: !r.isActive })} title={r.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'} />
            </div>
          )}
        />
      )}

      {form && (
        <CityFormModal
          city={form.city}
          mode={form.mode}
          saving={saveMut.isPending}
          onSave={(c) => saveMut.mutate({ city: c, mode: form.mode })}
          onClose={() => setForm(null)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete City?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
          </>}
        >
          <p className="text-sm text-notion-sub">This will remove the city. A city with active areas cannot be deleted.</p>
        </Modal>
      )}
    </div>
  )
}
