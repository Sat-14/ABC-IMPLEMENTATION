import { Badge } from './Badge'
import { CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react'

export default function IntegrityBadge({ status }) {
  const config = {
    intact: { variant: 'success', label: 'Intact', icon: CheckCircle },
    tampered: { variant: 'danger', label: 'TAMPERED', icon: AlertTriangle },
    unverified: { variant: 'default', label: 'Not Verified', icon: HelpCircle },
  }

  const { variant, label, icon: Icon } = config[status] || config.unverified

  return (
    <Badge variant={variant} className="gap-1.5 pl-2 pr-3 py-1">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Badge>
  )
}
