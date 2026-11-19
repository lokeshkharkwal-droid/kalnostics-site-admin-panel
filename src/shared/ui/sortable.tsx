'use client'

import type { CSSProperties, ReactNode } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/shared/utils'

/* ═══════════════════════════════════════
   SORTABLE (drag-to-reorder) helpers
   Rows move only from their grip handle, so inputs, buttons and row clicks
   inside a row keep working. The keyboard also works: focus the handle, press
   Space, move with the arrow keys, Space again to drop.
═══════════════════════════════════════ */

/** Six-dot drag handle icon. */
export const GripIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
  </svg>
)

/** DnD context for one vertical list of `ids`; calls `onMove(from, to)` when an item is dropped elsewhere. */
export function SortableScope({ ids, onMove, children }: {
  ids: readonly string[]
  onMove: (from: number, to: number) => void
  children: ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from >= 0 && to >= 0) onMove(from, to)
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids as string[]} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

/**
 * One sortable item. Returns the ref + style for the moving element and a ready
 * grip `handle` to render wherever the item wants it.
 */
export function useSortableItem(id: string) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  }
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      onClick={e => e.stopPropagation()}
      title="Drag to reorder"
      aria-label="Drag to reorder"
      className="shrink-0 cursor-grab touch-none rounded p-1 text-notion-faint hover:bg-notion-hover hover:text-notion-sub active:cursor-grabbing"
    >
      <GripIcon className="h-3.5 w-3.5" />
    </button>
  )
  return { setNodeRef, style, handle, isDragging }
}

function SortableListItem({ id, className, children }: {
  id: string
  className?: string
  children: (handle: ReactNode) => ReactNode
}) {
  const { setNodeRef, style, handle, isDragging } = useSortableItem(id)
  return (
    <div ref={setNodeRef} style={style} className={cn(className, isDragging && 'shadow-lg')}>
      {children(handle)}
    </div>
  )
}

/**
 * A vertical list whose items are reordered by dragging their grip handle.
 * `children(item, handle, index)` renders one item; place `handle` inside it.
 */
export function SortableList<T>({ items, getId, onMove, children, className, itemClassName }: {
  items: readonly T[]
  getId: (item: T) => string
  onMove: (from: number, to: number) => void
  children: (item: T, handle: ReactNode, index: number) => ReactNode
  className?: string
  itemClassName?: string
}) {
  const ids = items.map(getId)
  return (
    <SortableScope ids={ids} onMove={onMove}>
      <div className={className}>
        {items.map((item, i) => (
          <SortableListItem key={ids[i]} id={ids[i]} className={itemClassName}>
            {handle => children(item, handle, i)}
          </SortableListItem>
        ))}
      </div>
    </SortableScope>
  )
}
