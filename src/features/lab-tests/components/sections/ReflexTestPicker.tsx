'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@/shared/hooks'
import { Input } from '@/shared/ui'
import { searchLabTestsForReflex } from '../../services/lab-tests.api'
import { Label } from '../controls'
import { CloseIcon } from '../icons'

/**
 * Search-and-pick reflex tests from existing SITE_ADMIN templates. Selected
 * tests render as removable chips; only their ids are persisted server-side.
 */
export function ReflexTestPicker({
  selected, onAdd, onRemove,
}: {
  selected: { id: string; name: string }[]
  onAdd: (o: { id: string; name: string }) => void
  onRemove: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 350)

  const { data: results = [] } = useQuery({
    queryKey: ['siteadmin', 'lab-tests', 'reflex', debounced],
    queryFn: () => searchLabTestsForReflex({ search: debounced, limit: 8 }),
    enabled: debounced.trim().length > 0,
  })

  return (
    <div>
      <Label>Reflex Tests <span className="font-normal text-notion-faint">(pick existing tests)</span></Label>
      <div className="relative mt-1">
        <Input placeholder="Search a reflex test…" value={search} onChange={e => setSearch(e.target.value)} />
        {debounced.trim() && results.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-notion-line2 bg-white shadow-lg">
            {results.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onAdd(o); setSearch('') }}
                className="block w-full px-3 py-1.5 text-left text-sm text-notion-text hover:bg-notion-hover"
              >
                {o.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {selected.map(rt => (
          <span key={rt.id} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-notion-blue">
            {rt.name}
            <button type="button" title="Remove reflex test" className="hover:text-notion-red" onClick={() => onRemove(rt.id)}>
              <CloseIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
        {selected.length === 0 && <span className="text-[11px] text-notion-faint">No reflex tests added</span>}
      </div>
    </div>
  )
}
