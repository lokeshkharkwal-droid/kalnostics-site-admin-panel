'use client'

import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge, Button, Card, CardContent, DataTable, Input, Modal, PageLoader, PaginatedSelect, Toggle,
  type Column, type SelectOption,
} from '@/shared/ui'
import { EyeIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import type { StateListRow } from '@/entities/location'
import type { FormMode, State } from '../interfaces'
import { emptyState } from '../utils/constants'
import { stateFromEntity, stateToWriteDto } from '../utils/mapping'
import {
  createState, deleteState, fetchCountryNameMap, fetchCountryOptionsPage, getState, listStates, updateState,
} from '../services/locations.api'
import { StateFormModal } from './StateFormModal'

const LIMIT = 20
const QK = ['siteadmin', 'states'] as const

/** States tab — table, name search + Country filter, Add/View/Edit/Delete.
 *  `syncSlot` is an optional action (the India-import button) rendered just
 *  left of the Add button. */
export function StatesTab({ syncSlot }: { syncSlot?: React.ReactNode }) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState<SelectOption | null>(null)
  const [form, setForm] = useState<{ state: State; mode: FormMode } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch, countryFilter])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, search: debouncedSearch, countryId: countryFilter?.id ?? null }],
    queryFn: () => listStates({ page, limit: LIMIT, search: debouncedSearch, countryId: countryFilter?.id }),
    placeholderData: keepPreviousData,
  })

  const { data: countryNameMap = {} } = useQuery({
    queryKey: ['siteadmin', 'country-name-map'],
    queryFn: fetchCountryNameMap,
    staleTime: 60_000,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: QK })
    qc.invalidateQueries({ queryKey: ['siteadmin', 'state-name-map'] })
    qc.invalidateQueries({ queryKey: ['siteadmin', 'state-options'] })
  }

  const saveMut = useMutation({
    mutationFn: ({ state, mode }: { state: State; mode: FormMode }) =>
      mode === 'create' ? createState(stateToWriteDto(state)) : updateState(state.id, stateToWriteDto(state)),
    onSuccess: () => { invalidate(); setForm(null) },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => updateState(id, { isActive: next }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: deleteState,
    onSuccess: () => { invalidate(); setConfirmDelete(null) },
  })

  const countryName = (r: StateListRow) => countryNameMap[r.countryId] ?? r.countryId

  const openForm = async (id: string, mode: 'edit' | 'view') => {
    try {
      const full = await getState(id)
      setForm({ state: stateFromEntity(full, (c) => countryNameMap[c] ?? c), mode })
    } catch { /* error toast handled globally */ }
  }

  const columns: Column<StateListRow>[] = [
    { header: 'S.No.', width: 64, resizable: false, truncate: false,
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span> },
    { header: 'State Name', width: 220, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span> },
    { header: 'Code', width: 110,
      cell: r => <span className="font-mono text-xs text-notion-blue">{r.code}</span> },
    { header: 'Country', width: 200, tooltip: countryName,
      cell: r => <span className="text-notion-sub">{countryName(r)}</span> },
    { header: 'Status', width: 120, truncate: false,
      cell: r => <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-notion-faint">
            <SearchIcon className="h-4 w-4" />
          </span>
          <Input className="pl-8" placeholder="Search state name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-56">
          <PaginatedSelect
            value={countryFilter}
            onChange={setCountryFilter}
            queryKey={['siteadmin', 'country-options']}
            fetchPage={fetchCountryOptionsPage}
            placeholder="Filter by country"
            emptyText="No countries"
          />
        </div>
        {(search || countryFilter) && (
          <button onClick={() => { setSearch(''); setCountryFilter(null) }} className="text-xs text-notion-faint hover:text-notion-sub">Clear filters</button>
        )}
        <span className="ml-auto text-xs text-notion-faint">{total} {total === 1 ? 'state' : 'states'}</span>
        {syncSlot}
        <Button size="sm" onClick={() => setForm({ state: emptyState(), mode: 'create' })}>
          <PlusIcon className="h-3.5 w-3.5" /> Add State
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
          emptyMessage="No states found"
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
        <StateFormModal
          state={form.state}
          mode={form.mode}
          saving={saveMut.isPending}
          onSave={(s) => saveMut.mutate({ state: s, mode: form.mode })}
          onClose={() => setForm(null)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete State?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
          </>}
        >
          <p className="text-sm text-notion-sub">This will remove the state. A state with active cities cannot be deleted.</p>
        </Modal>
      )}
    </div>
  )
}
