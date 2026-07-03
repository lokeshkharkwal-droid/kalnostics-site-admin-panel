'use client'

import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge, Button, Card, CardContent, DataTable, Input, Modal, PageLoader, PaginatedSelect, Toggle,
  type Column, type SelectOption,
} from '@/shared/ui'
import { EyeIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import type { AreaListRow } from '@/entities/location'
import type { Area, FormMode } from '../interfaces'
import { emptyArea } from '../utils/constants'
import { areaFromEntity, areaToWriteDto } from '../utils/mapping'
import {
  createArea, deleteArea, fetchCityNameMap, fetchCityOptionsPage, fetchCountryNameMap,
  fetchCountryOptionsPage, fetchStateNameMap, fetchStateOptionsPage, getArea, listAreas, updateArea,
} from '../services/locations.api'
import { AreaFormModal } from './AreaFormModal'

const LIMIT = 20
const QK = ['siteadmin', 'areas'] as const

/** Areas tab — table, name search + Country→State→City cascading filters. */
export function AreasTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState<SelectOption | null>(null)
  const [stateFilter, setStateFilter] = useState<SelectOption | null>(null)
  const [cityFilter, setCityFilter] = useState<SelectOption | null>(null)
  const [form, setForm] = useState<{ area: Area; mode: FormMode } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch, countryFilter, stateFilter, cityFilter])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, search: debouncedSearch, countryId: countryFilter?.id ?? null, stateId: stateFilter?.id ?? null, cityId: cityFilter?.id ?? null }],
    queryFn: () => listAreas({ page, limit: LIMIT, search: debouncedSearch, countryId: countryFilter?.id, stateId: stateFilter?.id, cityId: cityFilter?.id }),
    placeholderData: keepPreviousData,
  })

  const { data: countryNameMap = {} } = useQuery({
    queryKey: ['siteadmin', 'country-name-map'], queryFn: fetchCountryNameMap, staleTime: 60_000,
  })
  const { data: stateNameMap = {} } = useQuery({
    queryKey: ['siteadmin', 'state-name-map'], queryFn: fetchStateNameMap, staleTime: 60_000,
  })
  const { data: cityNameMap = {} } = useQuery({
    queryKey: ['siteadmin', 'city-name-map'], queryFn: fetchCityNameMap, staleTime: 60_000,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const invalidate = () => { qc.invalidateQueries({ queryKey: QK }) }

  const saveMut = useMutation({
    mutationFn: ({ area, mode }: { area: Area; mode: FormMode }) =>
      mode === 'create' ? createArea(areaToWriteDto(area)) : updateArea(area.id, areaToWriteDto(area)),
    onSuccess: () => { invalidate(); setForm(null) },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => updateArea(id, { isActive: next }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => { invalidate(); setConfirmDelete(null) },
  })

  const cityName = (r: AreaListRow) => cityNameMap[r.cityId] ?? r.cityId
  const stateName = (r: AreaListRow) => stateNameMap[r.stateId] ?? r.stateId
  const countryName = (r: AreaListRow) => countryNameMap[r.countryId] ?? r.countryId

  const openForm = async (id: string, mode: 'edit' | 'view') => {
    try {
      const full = await getArea(id)
      setForm({
        area: areaFromEntity(full, (c) => countryNameMap[c] ?? c, (s) => stateNameMap[s] ?? s, (ci) => cityNameMap[ci] ?? ci),
        mode,
      })
    } catch { /* error toast handled globally */ }
  }

  const columns: Column<AreaListRow>[] = [
    { header: 'S.No.', width: 64, resizable: false, truncate: false,
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span> },
    { header: 'Area Name', width: 180, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span> },
    { header: 'Locality Name', width: 180, tooltip: r => r.locality,
      cell: r => <span className="text-notion-sub">{r.locality}</span> },
    { header: 'City', width: 160, tooltip: cityName,
      cell: r => <span className="text-notion-sub">{cityName(r)}</span> },
    { header: 'State', width: 160, tooltip: stateName,
      cell: r => <span className="text-notion-sub">{stateName(r)}</span> },
    { header: 'Country', width: 160, tooltip: countryName,
      cell: r => <span className="text-notion-sub">{countryName(r)}</span> },
    { header: 'Status', width: 120, truncate: false,
      cell: r => <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-52">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-notion-faint">
            <SearchIcon className="h-4 w-4" />
          </span>
          <Input className="pl-8" placeholder="Search area name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-44">
          <PaginatedSelect
            value={countryFilter}
            onChange={(opt) => { setCountryFilter(opt); setStateFilter(null); setCityFilter(null) }}
            queryKey={['siteadmin', 'country-options']}
            fetchPage={fetchCountryOptionsPage}
            placeholder="Country"
            emptyText="No countries"
          />
        </div>
        <div className="w-44">
          <PaginatedSelect
            value={stateFilter}
            onChange={(opt) => { setStateFilter(opt); setCityFilter(null) }}
            queryKey={['siteadmin', 'state-options', countryFilter?.id ?? null]}
            fetchPage={(p) => fetchStateOptionsPage({ ...p, countryId: countryFilter?.id })}
            placeholder={countryFilter ? 'State' : 'Country first'}
            emptyText="No states"
            disabled={!countryFilter}
          />
        </div>
        <div className="w-44">
          <PaginatedSelect
            value={cityFilter}
            onChange={setCityFilter}
            queryKey={['siteadmin', 'city-options', stateFilter?.id ?? null]}
            fetchPage={(p) => fetchCityOptionsPage({ ...p, stateId: stateFilter?.id, countryId: countryFilter?.id })}
            placeholder={stateFilter ? 'City' : 'State first'}
            emptyText="No cities"
            disabled={!stateFilter}
          />
        </div>
        {(search || countryFilter || stateFilter || cityFilter) && (
          <button onClick={() => { setSearch(''); setCountryFilter(null); setStateFilter(null); setCityFilter(null) }} className="text-xs text-notion-faint hover:text-notion-sub">Clear filters</button>
        )}
        <span className="ml-auto text-xs text-notion-faint">{total} {total === 1 ? 'area' : 'areas'}</span>
        <Button size="sm" onClick={() => setForm({ area: emptyArea(), mode: 'create' })}>
          <PlusIcon className="h-3.5 w-3.5" /> Add Area
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
          emptyMessage="No areas found"
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
        <AreaFormModal
          area={form.area}
          mode={form.mode}
          saving={saveMut.isPending}
          onSave={(a) => saveMut.mutate({ area: a, mode: form.mode })}
          onClose={() => setForm(null)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete Area?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
          </>}
        >
          <p className="text-sm text-notion-sub">This will remove the area/locality.</p>
        </Modal>
      )}
    </div>
  )
}
