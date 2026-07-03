'use client'

import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, Modal, PageLoader } from '@/shared/ui'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import { RULE_TYPE_LABELS, type PaymentRule, type PaymentRuleType, type StatusFilter } from '../interfaces'
import { emptyPaymentRule } from '../utils/constants'
import { fromEntity, toWriteDto } from '../utils/mapping'
import {
  createPaymentRule, deletePaymentRule, getPaymentRule, listPaymentRules, updatePaymentRule,
} from '../services/payment-rules.api'
import { PaymentRulesGrid } from './PaymentRulesGrid'
import { PaymentRuleFormModal, type FormMode } from './PaymentRuleFormModal'

const LIMIT = 20
const QK = ['siteadmin', 'payment-rules'] as const

const RULE_TYPE_FILTER_OPTIONS = (Object.keys(RULE_TYPE_LABELS) as PaymentRuleType[])

export function PaymentRulesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [ruleType, setRuleType] = useState<PaymentRuleType | ''>('')
  const [status, setStatus] = useState<StatusFilter>('')

  const [form, setForm] = useState<{ rule: PaymentRule; mode: FormMode } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch, ruleType, status])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, name: debouncedSearch, ruleType, status }],
    queryFn: () => listPaymentRules({ page, limit: LIMIT, name: debouncedSearch, ruleType, status }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const saveMut = useMutation({
    mutationFn: ({ rule, mode }: { rule: PaymentRule; mode: FormMode }) =>
      mode === 'create' ? createPaymentRule(toWriteDto(rule)) : updatePaymentRule(rule.id, toWriteDto(rule)),
    onSuccess: () => { invalidate(); setForm(null) },
  })

  const deleteMut = useMutation({
    mutationFn: deletePaymentRule,
    onSuccess: () => { invalidate(); setConfirmDelete(null) },
  })

  const openForm = async (id: string, mode: 'edit' | 'view') => {
    try {
      const full = await getPaymentRule(id)
      setForm({ rule: fromEntity(full), mode })
    } catch { /* error toast handled globally */ }
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Payment Rules"
        subtitle="Commission & tax rules managed across all businesses"
        actions={
          <Button size="sm" onClick={() => setForm({ rule: emptyPaymentRule(), mode: 'create' })}>
            <PlusIcon className="h-3.5 w-3.5" /> New Rule
          </Button>
        }
      />

      <main className="flex-1 space-y-4 p-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-notion-faint">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input className="pl-8" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as PaymentRuleType | '')}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Rule Types</option>
            {RULE_TYPE_FILTER_OPTIONS.map((t) => (
              <option key={t} value={t}>{RULE_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {(search || ruleType || status) && (
            <button onClick={() => { setSearch(''); setRuleType(''); setStatus('') }} className="text-xs text-notion-faint hover:text-notion-sub">
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'rule' : 'rules'}
          </span>
        </div>

        {isLoading ? (
          <Card><CardContent><PageLoader /></CardContent></Card>
        ) : (
          <PaymentRulesGrid
            rows={rows}
            startIndex={(page - 1) * LIMIT}
            loading={isFetching}
            onView={(id) => openForm(id, 'view')}
            onEdit={(id) => openForm(id, 'edit')}
            onDelete={(id) => setConfirmDelete(id)}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-notion-sub">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* New / Edit / View form */}
      {form && (
        <PaymentRuleFormModal
          rule={form.rule}
          mode={form.mode}
          saving={saveMut.isPending}
          onSave={(r) => saveMut.mutate({ rule: r, mode: form.mode })}
          onClose={() => setForm(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal
          title="Delete Payment Rule?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
          </>}
        >
          <p className="text-sm text-notion-sub">This payment rule will be removed. This action can be reversed only by a developer.</p>
        </Modal>
      )}
    </div>
  )
}
