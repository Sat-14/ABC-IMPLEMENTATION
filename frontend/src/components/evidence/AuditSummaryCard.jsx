import { useState, useEffect } from 'react'
import {
  Brain, AlertTriangle, CheckCircle, Clock, Users,
  Shield, ChevronDown, ChevronUp, Activity, ArrowLeftRight,
  Upload, Eye, FileText
} from 'lucide-react'
import { getEvidenceAuditSummary } from '../../api/audit'
import { Badge } from '../common/Badge'
import { formatDate } from '../../utils/formatters'

const RISK_STYLES = {
  high: 'border-l-red-500 bg-red-500/5',
  medium: 'border-l-amber-500 bg-amber-500/5',
  low: 'border-l-blue-500 bg-blue-500/5',
}

const RISK_ICON_COLORS = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-blue-500',
}

const EVENT_ICONS = {
  upload: Upload,
  verification: Shield,
  transfer: ArrowLeftRight,
  view: Eye,
  download: FileText,
}

const SIG_COLORS = {
  high: 'danger',
  medium: 'primary',
  low: 'default',
}

function HighlightedText({ text }) {
  if (!text) return null
  const parts = text.split(/(TAMPERED|COMPROMISED|WARNING|intact|unbroken|suitable for court)/gi)
  return (
    <p className="text-sm text-text-secondary leading-relaxed">
      {parts.map((part, i) => {
        const lower = part.toLowerCase()
        if (lower === 'tampered' || lower === 'compromised')
          return <span key={i} className="text-red-500 font-semibold">{part}</span>
        if (lower === 'warning')
          return <span key={i} className="text-amber-500 font-semibold">{part}</span>
        if (lower === 'intact' || lower === 'unbroken' || lower === 'suitable for court')
          return <span key={i} className="text-green-600 font-semibold">{part}</span>
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}

export default function AuditSummaryCard({ evidenceId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sections, setSections] = useState({
    narratives: true,
    risks: true,
    events: false,
    stats: false,
  })

  const toggle = (key) => setSections(prev => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    async function load() {
      try {
        const res = await getEvidenceAuditSummary(evidenceId)
        setData(res.data)
      } catch {
        setError('Unable to generate audit summary')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [evidenceId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error || !data) return null

  const stats = data.statistics || {}

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-primary-50/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">AI-Generated Audit Summary</h2>
            <Badge variant="primary">XAI</Badge>
          </div>
          <span className="text-[10px] text-text-tertiary">
            Generated {formatDate(data.generated_at)}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Main Summary */}
        <div className="bg-bg-secondary/30 rounded-xl p-4 border border-border-subtle">
          <HighlightedText text={data.summary_text} />
        </div>

        {/* Narratives (collapsible) */}
        <div>
          <button onClick={() => toggle('narratives')}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-primary mb-3">
            {sections.narratives ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Detailed Analysis
          </button>
          {sections.narratives && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-text-primary">Integrity Analysis</span>
                </div>
                <HighlightedText text={data.integrity_narrative} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-text-primary">Custody Analysis</span>
                </div>
                <HighlightedText text={data.custody_narrative} />
              </div>
            </div>
          )}
        </div>

        {/* Risk Flags */}
        {data.risk_flags && data.risk_flags.length > 0 && (
          <div>
            <button onClick={() => toggle('risks')}
              className="flex items-center gap-1.5 text-xs font-semibold text-text-primary mb-3">
              {sections.risks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Risk Assessment ({data.risk_flags.length})
            </button>
            {sections.risks && (
              <div className="space-y-2 animate-in fade-in duration-200">
                {data.risk_flags.map((flag, i) => (
                  <div key={i} className={`flex gap-3 p-3 rounded-lg border-l-4 ${RISK_STYLES[flag.level] || RISK_STYLES.low}`}>
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${RISK_ICON_COLORS[flag.level] || 'text-blue-500'}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm text-text-primary font-medium">{flag.message}</p>
                        <Badge variant={SIG_COLORS[flag.level] || 'default'}>
                          {flag.level}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-tertiary italic">{flag.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Key Events */}
        {data.key_events && data.key_events.length > 0 && (
          <div>
            <button onClick={() => toggle('events')}
              className="flex items-center gap-1.5 text-xs font-semibold text-text-primary mb-3">
              {sections.events ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Key Events ({data.key_events.length})
            </button>
            {sections.events && (
              <div className="space-y-0 animate-in fade-in duration-200">
                {data.key_events.map((event, idx) => {
                  const Icon = EVENT_ICONS[event.type] || Activity
                  const isLast = idx === data.key_events.length - 1
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          event.significance === 'high' ? 'bg-red-50 text-red-500' :
                          event.significance === 'medium' ? 'bg-blue-50 text-blue-500' :
                          'bg-gray-50 text-gray-400'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {!isLast && <div className="w-0.5 flex-1 my-1 bg-border-subtle"></div>}
                      </div>
                      <div className="pb-4 flex-1">
                        <p className="text-xs text-text-primary font-medium">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-text-tertiary" />
                          <span className="text-[10px] text-text-tertiary">{formatDate(event.timestamp)}</span>
                          <Badge variant={SIG_COLORS[event.significance] || 'default'}>
                            {event.significance}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Statistics Grid */}
        <div>
          <button onClick={() => toggle('stats')}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-primary mb-3">
            {sections.stats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Statistics
          </button>
          {sections.stats && (
            <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-200">
              {[
                { icon: Activity, label: 'Total Actions', value: stats.total_actions || 0 },
                { icon: Shield, label: 'Verifications', value: stats.total_verifications || 0 },
                { icon: ArrowLeftRight, label: 'Transfers', value: stats.total_transfers || 0 },
                { icon: Users, label: 'Unique Users', value: stats.unique_users || 0 },
                { icon: Clock, label: 'Time Span', value: `${stats.time_span_days || 0}d` },
                { icon: CheckCircle, label: 'First Action', value: stats.first_action ? formatDate(stats.first_action).split(',')[0] : 'N/A' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-bg-secondary/50 rounded-lg p-3 text-center">
                  <Icon className="w-4 h-4 text-text-tertiary mx-auto mb-1" />
                  <p className="text-lg font-bold text-text-primary">{value}</p>
                  <p className="text-[10px] text-text-tertiary">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
