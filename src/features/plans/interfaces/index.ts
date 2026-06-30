import type { PlanDetail } from '@/entities/plan'

export interface IPlanCardProps {
  detail: PlanDetail
  onEdit: () => void
}

export interface IEditDrawerProps {
  detail: PlanDetail
  onSave: (updated: PlanDetail) => void
  onClose: () => void
}
