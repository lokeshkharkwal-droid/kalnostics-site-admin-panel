'use client'

import { Button, Modal } from '@/shared/ui'
import { BarcodeSvg } from '@/features/inventory-print-barcode'
import type { IReferenceRow } from '../services/reference.api'

/**
 * Per-row "Print Barcode" preview for inventory categories. Renders a printable
 * barcode of the category **code** (falling back to the name when the code is
 * empty) together with the category-name label, and prints just the barcode area
 * via {@link window.print} scoped with a print-only stylesheet.
 */
export function PrintBarcodeModal({
  row,
  onClose,
}: {
  row: IReferenceRow
  onClose: () => void
}) {
  // Prefer the human-entered code; fall back to the name so the barcode is never empty.
  const value = (row.code?.trim() || row.name?.trim() || '').trim()

  const handlePrint = () => window.print()

  return (
    <Modal
      title="Print Barcode"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button type="button" size="sm" onClick={handlePrint} disabled={!value}>
            Print
          </Button>
        </>
      }
    >
      {/*
        While this modal is open, hide the whole document on print and reveal only
        the barcode area (`#category-barcode-print`). Dependency-free, scoped to
        the print media query so it never affects the on-screen layout.
      */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #category-barcode-print, #category-barcode-print * { visibility: visible !important; }
          #category-barcode-print {
            position: fixed;
            inset: 0;
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>

      {value ? (
        <div
          id="category-barcode-print"
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-notion-line bg-white px-6 py-5"
        >
          <span className="text-sm font-semibold text-black">{row.name}</span>
          <BarcodeSvg value={value} height={56} />
        </div>
      ) : (
        <p className="text-sm text-notion-sub">
          This category has no code or name to encode as a barcode.
        </p>
      )}
    </Modal>
  )
}
