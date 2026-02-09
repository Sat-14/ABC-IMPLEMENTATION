import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { getEvidenceTrustScore } from '../../api/evidence'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'

const GRADE_COLORS = {
  A: { ring: 'text-green-500', bg: 'bg-green-500', badge: 'success', label: 'text-green-600' },
  B: { ring: 'text-blue-500', bg: 'bg-blue-500', badge: 'primary', label: 'text-blue-600' },
  C: { ring: 'text-amber-500', bg: 'bg-amber-500', badge: 'warning', label: 'text-amber-600' },
  D: { ring: 'text-orange-500', bg: 'bg-orange-500', badge: 'warning', label: 'text-orange-600' },
  F: { ring: 'text-red-500', bg: 'bg-red-500', badge: 'danger', label: 'text-red-600' },
}

const STATUS_COLORS = {
  good: 'bg-green-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
}

export default function TrustScoreCard({ evidenceId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await getEvidenceTrustScore(evidenceId)
        setData(res.data)
      } catch {
        setError('Unable to compute trust score')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [evidenceId])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-text-tertiary text-sm">
          <Info className="w-4 h-4" />
          {error || 'Trust score unavailable'}
        </div>
      </Card>
    )
  }

  const colors = GRADE_COLORS[data.grade] || GRADE_COLORS.C
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (data.score / 100) * circumference

  return (
    <Card className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-text-primary">XAI Trust Score</h3>
        </div>
        <Badge variant={colors.badge}>{data.grade_label}</Badge>
      </div>

      {/* Circular Score */}
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor"
              className="text-bg-tertiary" strokeWidth="7" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor"
              className={colors.ring} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className="text-2xl font-bold text-text-primary">{Math.round(data.score)}</span>
            <span className={`text-xs font-bold ${colors.label}`}>Grade {data.grade}</span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-text-secondary leading-relaxed flex-1">
          {data.summary}
        </p>
      </div>

      {/* Component Breakdown */}
      <div className="space-y-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showDetails ? 'Hide' : 'Show'} Factor Breakdown
        </button>

        {showDetails && (
          <div className="space-y-3 animate-in fade-in duration-300">
            {data.components.map(comp => (
              <div key={comp.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-primary">{comp.name}</span>
                  <span className="text-xs text-text-secondary font-mono">
                    {comp.score}/{comp.max_score}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${STATUS_COLORS[comp.status] || 'bg-gray-400'}`}
                    style={{ width: `${comp.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-tertiary leading-relaxed">{comp.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Flags */}
      {data.risk_flags && data.risk_flags.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-text-primary">Risk Flags</span>
          </div>
          {data.risk_flags.map((flag, i) => (
            <p key={i} className="text-[11px] text-amber-700 bg-amber-50 px-3 py-2 rounded-lg leading-relaxed">
              {flag}
            </p>
          ))}
        </div>
      )}
    </Card>
  )
}
