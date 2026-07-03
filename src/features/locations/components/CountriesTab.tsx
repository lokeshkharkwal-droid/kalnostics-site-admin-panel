'use client'

import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge, Button, Card, CardContent, DataTable, Input, Modal, PageLoader, Toggle, type Column,
} from '@/shared/ui'
import { EyeIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import type { CountryListRow } from '@/entities/location'
import type { Country, FormMode } from '../interfaces'
import { emptyCountry } from '../utils/constants'
import { countryFromEntity, countryToWriteDto } from '../utils/mapping'
import {
  createCountry, deleteCountry, getCountry, listCountries, updateCountry,
} from '../services/locations.api'
import { CountryFormModal } from './CountryFormModal'

const LIMIT = 20
const QK = ['siteadmin', 'countries'] as const

/** Countries tab — paginated table, name search, Add/View/Edit/Delete. */
export function CountriesTab() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<{ country: Country; mode: FormMode } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, search: debouncedSearch }],
    queryFn: () => listCountries({ page, limit: LIMIT, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  // Refresh the list, the country name-map and the country option dropdowns.
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: QK })
    qc.invalidateQueries({ queryKey: ['siteadmin', 'country-name-map'] })
    qc.invalidateQueries({ queryKey: ['siteadmin', 'country-options'] })
  }

  const saveMut = useMutation({
    mutationFn: ({ country, mode }: { country: Country; mode: FormMode }) =>
      mode === 'create'
        ? createCountry(countryToWriteDto(country))
        : updateCountry(country.id, countryToWriteDto(country)),
    onSuccess: () => { invalidate(); setForm(null) },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => updateCountry(id, { isActive: next }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: deleteCountry,
    onSuccess: () => { invalidate(); setConfirmDelete(null) },
  })

  const openForm = async (id: string, mode: 'edit' | 'view') => {
    try {
      const full = await getCountry(id)
      setForm({ country: countryFromEntity(full), mode })
    } catch { /* error toast handled globally */ }
  }

  const columns: Column<CountryListRow>[] = [
    { header: 'S.No.', width: 64, resizable: false, truncate: false,
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span> },
    { header: 'Country Name', width: 260, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span> },
    { header: 'Code', width: 120,
      cell: r => <span className="font-mono text-xs text-notion-blue">{r.code}</span> },
    { header: 'Status', width: 120, truncate: false,
      cell: r => <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-notion-faint">
            <SearchIcon className="h-4 w-4" />
          </span>
          <Input className="pl-8" placeholder="Search country name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-notion-faint hover:text-notion-sub">Clear</button>
        )}
        <span className="ml-auto text-xs text-notion-faint">{total} {total === 1 ? 'country' : 'countries'}</span>
        <Button size="sm" onClick={() => setForm({ country: emptyCountry(), mode: 'create' })}>
          <PlusIcon className="h-3.5 w-3.5" /> Add Country
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
          emptyMessage="No countries found"
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
        <CountryFormModal
          country={form.country}
          mode={form.mode}
          saving={saveMut.isPending}
          onSave={(c) => saveMut.mutate({ country: c, mode: form.mode })}
          onClose={() => setForm(null)}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete Country?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
          </>}
        >
          <p className="text-sm text-notion-sub">This will remove the country. A country with active states cannot be deleted.</p>
        </Modal>
      )}
    </div>
  )
}
