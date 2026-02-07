import { Badge } from './Badge'

const STATUS_VARIANTS = {
  active: 'success',
  open: 'primary',
  closed: 'default',
  archived: 'warning',
  disposed: 'danger',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'success',
  cancelled: 'default',
}

export default function StatusBadge({ status }) {
  const variant = STATUS_VARIANTS[status] || 'default'
  return (
    <Badge variant={variant}>
      {status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </Badge>
  )
}
