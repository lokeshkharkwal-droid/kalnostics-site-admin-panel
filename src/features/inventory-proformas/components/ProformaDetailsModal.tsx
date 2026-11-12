'use client'

import { useQuery } from '@tanstack/react-query'
import { Badge, Button, PageLoader } from '@/shared/ui'
import {
  fetchProformaLabelMaps,
  getProforma,
  type IProforma,
  type IProformaItem,
} from '../services/proformas.api'

interface Props {
  proforma: IProforma
  onClose: () => void
}

/** Today-agnostic display of a proforma date in the browser locale. */
function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

/** Resolve one line item into its `{ type, name, quantity }` display shape. */
function describeItem(
  it: IProformaItem,
  products: Map<string, string> | undefined,
  labTests: Map<string, string> | undefined,
): { type: string; name: string; quantity: number } {
  const id = (it.labTestId ?? it.masterProductId) as string
  if (it.labTestId) {
    return { type: 'Lab Test', name: labTests?.get(id) ?? id, quantity: it.quantity }
  }
  return { type: 'Product', name: products?.get(id) ?? id, quantity: it.quantity }
}

/**
 * Read-only view of a proforma: its header fields plus the resolved line-item
 * table. Reuses the overlay/card markup from {@link ProformaFormModal} without
 * any editable inputs.
 */
export function ProformaDetailsModal({ proforma, onClose }: Props) {
  const detail = useQuery({
    queryKey: ['inventory', 'proformas', 'detail', proforma.id],
    queryFn: () => getProforma(proforma.id),
  })

  const labelMaps = useQuery({
    queryKey: ['inventory', 'proformas', 'labelMaps'],
    queryFn: fetchProformaLabelMaps,
  })

  const data = detail.data ?? proforma
  const loading = detail.isLoading || labelMaps.isLoading
  const items = (detail.data?.items ?? []).filter((it) => it.masterProductId || it.labTestId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
          <h2 className="text-sm font-semibold text-notion-text">Proforma Details</h2>
          <button onClick={onClose} className="text-notion-faint transition-colors hover:text-notion-sub">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-8">
            <PageLoader />
          </div>
        ) : (
          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-notion-faint">Name</p>
                <p className="text-sm text-notion-text">{data.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-notion-faint">Date</p>
                <p className="text-sm text-notion-text">{formatDate(data.date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-notion-faint">Status</p>
                <Badge variant={data.status === 'ACTIVE' ? 'success' : 'secondary'}>
                  {data.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {data.notes && (
              <div>
                <p className="text-xs font-medium text-notion-faint">Notes</p>
                <p className="whitespace-pre-wrap text-sm text-notion-text">{data.notes}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-notion-text">Line Items</p>
              {items.length === 0 ? (
                <p className="text-sm text-notion-faint">No line items.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-notion-line">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-notion-line bg-notion-hover text-left text-xs font-medium text-notion-sub">
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="w-24 px-3 py-2 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => {
                        const d = describeItem(it, labelMaps.data?.products, labelMaps.data?.labTests)
                        return (
                          <tr key={it.id ?? i} className="border-b border-notion-line last:border-0">
                            <td className="px-3 py-2 text-notion-sub">{d.type}</td>
                            <td className="px-3 py-2 text-notion-text">{d.name}</td>
                            <td className="px-3 py-2 text-right text-notion-text">{d.quantity}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
