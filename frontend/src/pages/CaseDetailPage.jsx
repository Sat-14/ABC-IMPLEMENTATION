import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Calendar, FileText, Shield,
  HardDrive, Clock, Hash, Download, Eye,
  CheckCircle, AlertTriangle
} from 'lucide-react'
import { getCase, getCaseEvidence } from '../api/cases'
import { formatDate, formatFileSize } from '../utils/formatters'
import StatusBadge from '../components/common/StatusBadge'
import IntegrityBadge from '../components/common/IntegrityBadge'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'

export default function CaseDetailPage() {
  const { id } = useParams()
  const [caseData, setCaseData] = useState(null)
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closingReason, setClosingReason] = useState('')
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [caseRes, evidenceRes] = await Promise.all([
          getCase(id),
          getCaseEvidence(id),
        ])
        setCaseData(caseRes.data.case)
        setEvidence(evidenceRes.data.evidence || [])
      } catch {
        setError('Failed to load case details')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleCloseCase = async (e) => {
    e.preventDefault()
    if (!closingReason) return
    setIsClosing(true)
    try {
      const { updateCase } = await import('../api/cases')
      const res = await updateCase(id, {
        status: 'closed',
        closing_reason: closingReason
      })
      setCaseData(res.data.case)
      setShowCloseModal(false)
      setClosingReason('')
    } catch (err) {
      setError('Failed to close case')
    } finally {
      setIsClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error || 'Case not found'}
        </div>
        <Link to="/cases" className="inline-block mt-4 text-primary-600 hover:underline">
          &larr; Return to Cases
        </Link>
      </div>
    )
  }

  const StatCard = ({ icon: Icon, label, value, subtext }) => (
    <Card className="p-4 flex items-start gap-4">
      <div className="p-2.5 rounded-lg bg-primary-50 text-primary-600">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="text-lg font-semibold text-text-primary mt-0.5">{value}</p>
        {subtext && <p className="text-xs text-text-tertiary mt-1">{subtext}</p>}
      </div>
    </Card>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <Link
          to="/cases"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">{caseData.title}</h1>
              <StatusBadge status={caseData.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5 bg-bg-secondary px-2.5 py-1 rounded-md font-mono text-xs">
                <Hash className="w-3.5 h-3.5" />
                {caseData.case_number}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Created {formatDate(caseData.created_at)}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {caseData.status !== 'closed' && (
              <Button
                variant="ghost"
                className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                onClick={() => setShowCloseModal(true)}
              >
                Close Case
              </Button>
            )}
          </div>
        </div>
      </div>

      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-[0_30px_60px_-12px_rgba(0,0,0,0.45)] bg-white border-none animate-in zoom-in-95 duration-300 overflow-hidden rounded-3xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Close Case</h2>
                  <p className="text-[11px] font-bold text-red-600/80 uppercase tracking-widest mt-0.5">Administrative Action</p>
                </div>
              </div>

              <p className="text-base text-[#4B5563] mb-8 leading-relaxed">
                You are about to finalize and close case <span className="font-mono font-bold text-[#111827] bg-gray-100 px-2 py-0.5 rounded">{caseData.case_number}</span>.
                Please provide a formal justification for this closure.
              </p>

              <form onSubmit={handleCloseCase} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#374151] ml-1">Closing Reason</label>
                  <textarea
                    value={closingReason}
                    onChange={(e) => setClosingReason(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-[#F9FAFB] text-[#111827] rounded-2xl border-2 border-[#E5E7EB] px-4 py-4 outline-none transition-all duration-200 focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/10 placeholder:text-[#9CA3AF] resize-none text-base border-solid shadow-sm"
                    placeholder="Describe the outcome of the investigation..."
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCloseModal(false)} className="hover:bg-gray-100 rounded-xl px-6">
                    Cancel
                  </Button>
                  <Button type="submit" variant="danger" loading={isClosing} className="bg-red-600 hover:bg-red-700 text-white border-transparent px-8 h-12 rounded-xl font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                    Finalize Closure
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HardDrive}
          label="Total Evidence"
          value={evidence.length}
          subtext={`${evidence.filter(e => e.status !== 'disposed').length} active files`}
        />
        <StatCard
          icon={Clock}
          label="Last Updated"
          value={formatDate(caseData.updated_at).split(',')[0]}
          subtext={formatDate(caseData.updated_at).split(',')[1]}
        />
        <StatCard
          icon={Shield}
          label="Chain of Custody"
          value="Verified"
          subtext="Blockchain integrity intact"
        />
        <StatCard
          icon={FileText}
          label="Case Type"
          value="Digital Forensics"
          subtext="Internal Investigation"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content - Evidence List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary-600" />
              Evidence Files
            </h2>
            <Link to="/evidence/upload">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Evidence
              </Button>
            </Link>
          </div>

          <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border-subtle">
            {evidence.length === 0 ? (
              <div className="text-center py-16 bg-bg-primary/50">
                <div className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                  <HardDrive className="w-6 h-6 text-text-tertiary" />
                </div>
                <h3 className="text-sm font-medium text-text-primary">No evidence collected</h3>
                <p className="text-sm text-text-secondary mt-1">Upload files to establish chain of custody.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-secondary/50 border-b border-border-subtle">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">File Details</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Integrity</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Uploaded</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {evidence.map(e => (
                      <tr key={e.evidence_id} className="group hover:bg-bg-secondary/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <Link to={`/evidence/${e.evidence_id}`} className="font-medium text-text-primary hover:text-primary-600 transition-colors block">
                                {e.file_name}
                              </Link>
                              <p className="text-xs text-text-tertiary mt-0.5">{formatFileSize(e.file_size)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <IntegrityBadge status={e.integrity_status} />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {formatDate(e.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/evidence/${e.evidence_id}`}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Case Info */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-24">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-600" />
              Case Details
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Description</label>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  {caseData.description || 'No description provided for this case.'}
                </p>
              </div>

              <div className="pt-4 border-t border-border-subtle space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Status</span>
                  <StatusBadge status={caseData.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Created By</span>
                  <span className="text-text-primary truncate max-w-[120px]" title={caseData.created_by_name}>
                    {caseData.created_by_name || 'Unknown'}
                  </span>
                </div>
                {caseData.status === 'closed' && (
                  <div className="pt-6 mt-6 border-t border-border-subtle">
                    <div className="rounded-2xl bg-red-500/5 border border-red-500/10 p-5 space-y-4 relative overflow-hidden">
                      <div className="absolute -right-2 -top-2 opacity-[0.03]">
                        <AlertTriangle className="w-16 h-16 text-red-600" />
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-red-600" />
                        <span className="text-[11px] font-bold text-red-700 uppercase tracking-widest">Case Closure Audit</span>
                      </div>

                      <div className="space-y-3.5 relative">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-tight">Closed On</span>
                          <span className="text-sm text-text-primary font-medium">{formatDate(caseData.closed_at)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-tight">Authorized By</span>
                          <span className="text-sm text-text-primary font-medium">{caseData.closed_by_name}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-tight">Closure Purpose</span>
                          <blockquote className="text-sm text-text-secondary italic bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-red-500/10 shadow-sm leading-relaxed">
                            "{caseData.closing_reason}"
                          </blockquote>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Plus(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
