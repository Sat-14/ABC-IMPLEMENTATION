import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, AlertTriangle, Trash2, Shield, CheckCircle, RefreshCw, FileText, Info } from 'lucide-react'
import { checkRetention, disposeEvidence } from '../api/evidence'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import useAuth from '../hooks/useAuth'
import { hasPermission } from '../utils/roles'

export default function RetentionPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [disposing, setDisposing] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await checkRetention()
      setData(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDispose(evidenceId, fileName) {
    if (!confirm(`Dispose "${fileName}"? This action marks it as disposed and is logged in the audit trail.`)) return
    setDisposing(evidenceId)
    try {
      await disposeEvidence(evidenceId, 'Retention policy expired')
      load()
    } catch {
      alert('Failed to dispose evidence')
    } finally {
      setDisposing(null)
    }
  }

  const canDispose = hasPermission(user?.role, 'delete')

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Retention & Disposal</h1>
          <p className="text-text-secondary mt-1">Monitor evidence retention policies and manage disposal workflows</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Policy Info */}
      <Card className="p-5 bg-blue-50/50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Default Retention Policies</h3>
            <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
              <span><strong>Open cases:</strong> No auto-disposal</span>
              <span><strong>Closed cases:</strong> 365 days after closure</span>
              <span><strong>Archived:</strong> 180 days after archival</span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">Custom retention can be set per-case via case settings.</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <FileText className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-text-primary">{data.statistics.total_checked}</p>
            <p className="text-xs text-text-secondary">Evidence Checked</p>
          </Card>
          <Card className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-text-primary">{data.statistics.flagged_for_review}</p>
            <p className="text-xs text-text-secondary">Flagged for Review</p>
          </Card>
          <Card className="p-4 text-center">
            <Trash2 className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-text-primary">{data.statistics.already_disposed}</p>
            <p className="text-xs text-text-secondary">Already Disposed</p>
          </Card>
        </div>
      )}

      {/* Flagged Evidence */}
      {loading ? (
        <div className="text-center py-12 text-text-tertiary">Scanning retention policies...</div>
      ) : data?.flagged_evidence?.length === 0 ? (
        <Card className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">All Clear</h3>
          <p className="text-text-secondary text-sm">No evidence items require disposal review at this time.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Flagged Evidence ({data?.flagged_evidence?.length || 0})
          </h2>
          {data?.flagged_evidence?.map(item => (
            <Card key={item.evidence_id} className={`p-4 border-l-4 ${
              item.expired ? 'border-l-red-500 bg-red-50/30' : 'border-l-amber-500 bg-amber-50/30'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/evidence/${item.evidence_id}`} className="font-semibold text-text-primary hover:text-primary-600 transition-colors">
                      {item.file_name}
                    </Link>
                    <Badge variant={item.expired ? 'danger' : 'warning'}>
                      {item.expired ? 'EXPIRED' : 'Expiring Soon'}
                    </Badge>
                    <Badge variant={item.integrity_status === 'intact' ? 'success' : item.integrity_status === 'tampered' ? 'danger' : 'default'}>
                      {item.integrity_status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                    <span>Case: <strong>{item.case_number}</strong> ({item.case_status})</span>
                    <span>Retention: <strong>{item.retention_days} days</strong></span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.expired
                        ? <span className="text-red-600 font-semibold">Expired</span>
                        : <span className="text-amber-600 font-semibold">{item.days_remaining} days remaining</span>
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/evidence/${item.evidence_id}`}>
                    <Button variant="ghost" size="sm">
                      <Shield className="w-3.5 h-3.5" />
                      Review
                    </Button>
                  </Link>
                  {canDispose && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDispose(item.evidence_id, item.file_name)}
                      disabled={disposing === item.evidence_id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {disposing === item.evidence_id ? 'Disposing...' : 'Dispose'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
