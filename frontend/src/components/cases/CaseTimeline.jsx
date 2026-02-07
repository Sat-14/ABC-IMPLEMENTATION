import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen, Upload, ArrowLeftRight, ShieldCheck, ShieldX,
  Check, CheckCheck, X, Clock, AlertTriangle
} from 'lucide-react'
import { getCaseTimeline } from '../../api/cases'
import { formatDate } from '../../utils/formatters'

const ICON_MAP = {
  'folder': FolderOpen,
  'upload': Upload,
  'transfer': ArrowLeftRight,
  'check': Check,
  'check-double': CheckCheck,
  'x': X,
  'shield-check': ShieldCheck,
  'shield-x': ShieldX,
}

const TYPE_COLORS = {
  case: 'bg-purple-50 text-purple-600 border-purple-200',
  evidence: 'bg-blue-50 text-blue-600 border-blue-200',
  transfer: 'bg-amber-50 text-amber-600 border-amber-200',
  verification: 'bg-green-50 text-green-600 border-green-200',
}

const TYPE_LINE_COLORS = {
  case: 'bg-purple-300',
  evidence: 'bg-blue-300',
  transfer: 'bg-amber-300',
  verification: 'bg-green-300',
}

export default function CaseTimeline({ caseId }) {
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await getCaseTimeline(caseId)
        setTimeline(res.data.timeline || [])
      } catch {
        setError('Failed to load timeline')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [caseId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">
        <AlertTriangle className="w-4 h-4" />
        {error}
      </div>
    )
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-12 text-text-tertiary">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No timeline events yet</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {timeline.map((event, idx) => {
        const IconComp = ICON_MAP[event.icon] || Clock
        const colors = TYPE_COLORS[event.type] || 'bg-gray-50 text-gray-600 border-gray-200'
        const lineColor = TYPE_LINE_COLORS[event.type] || 'bg-gray-300'
        const isLast = idx === timeline.length - 1

        const linkTo = event.type === 'evidence' && event.entity_id
          ? `/evidence/${event.entity_id}`
          : null

        return (
          <div key={`${event.action}-${event.timestamp}-${idx}`} className="flex gap-4 group">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 ${colors} transition-all group-hover:scale-110`}>
                <IconComp className="w-4 h-4" />
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 my-1 ${lineColor} opacity-30`}></div>
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 flex-1 ${isLast ? '' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  {linkTo ? (
                    <Link to={linkTo} className="text-sm font-semibold text-text-primary hover:text-primary-600 transition-colors">
                      {event.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-text-primary">{event.title}</p>
                  )}
                  {event.description && (
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{event.description}</p>
                  )}
                </div>
                <span className="text-[11px] text-text-tertiary whitespace-nowrap flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDate(event.timestamp)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
