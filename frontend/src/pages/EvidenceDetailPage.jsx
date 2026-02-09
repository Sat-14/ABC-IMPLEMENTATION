import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getEvidence, verifyEvidence, getEvidenceHistory, downloadEvidence, previewEvidence, transcribeEvidence, linkEvidenceToCase, unlinkEvidenceFromCase } from '../api/evidence'
import { downloadEvidenceReport } from '../api/reports'
import { getCases } from '../api/cases'
import { getEvidenceAuditLogs } from '../api/audit'
import { requestTransfer } from '../api/transfers'
import { getUsers } from '../api/auth'
import useAuth from '../hooks/useAuth'
import { hasPermission } from '../utils/roles'
import { formatDate, formatFileSize, formatCategoryLabel } from '../utils/formatters'
import IntegrityBadge from '../components/common/IntegrityBadge'
import StatusBadge from '../components/common/StatusBadge'
import TrustScoreCard from '../components/evidence/TrustScoreCard'
import AuditSummaryCard from '../components/evidence/AuditSummaryCard'
import TransferModal from '../components/evidence/TransferModal'
import ShareModal from '../components/evidence/ShareModal'
import {
  Shield,
  History,
  Copy,
  Check,
  Fingerprint,
  Info,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Clock,
  User,
  Hash,
  AlertTriangle,
  ArrowRightLeft,
  Activity,
  Eye,
  Download,
  Mic,
  FileAudio,
  Share2,
  MapPin,
  Link as LinkIcon,
  Unlink,
  Plus,
  Loader2
} from 'lucide-react'

const HashDisplay = ({ label, hash, className = "" }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const truncatedHash = hash ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}` : 'N/A'

  return (
    <div className={`p-3 bg-gray-100/50 rounded-lg border border-gray-100 group transition-all hover:bg-gray-100/80 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <dt className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1.5">
          <Hash size={10} />
          {label}
        </dt>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-blue-600 transition-colors p-1"
          title="Copy full hash"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        </button>
      </div>
      <dd className="text-xs font-mono text-gray-700 break-all select-all flex items-center justify-between">
        <span className="truncate" title={hash}>{truncatedHash}</span>
      </dd>
    </div>
  )
}

export default function EvidenceDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [evidence, setEvidence] = useState(null)
  const [hashHistory, setHashHistory] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)
  const [users, setUsers] = useState([])
  const [showShare, setShowShare] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [trustScore, setTrustScore] = useState(null)
  const [allCases, setAllCases] = useState([])
  const [selectedCaseToLink, setSelectedCaseToLink] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)


  useEffect(() => {
    async function load() {
      try {
        const [evRes, histRes, auditRes] = await Promise.all([
          getEvidence(id),
          getEvidenceHistory(id),
          getEvidenceAuditLogs(id),
        ])
        setEvidence(evRes.data.evidence)
        setHashHistory(histRes.data.records || [])
        setAuditLogs(auditRes.data.logs || [])
      } catch {
        setError('Failed to load evidence details')
      } finally {
        setLoading(false)
      }
    }
    load()
    getCases({ per_page: 100 }).then(res => setAllCases(res.data.cases || [])).catch(() => { })
  }, [id])

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const res = await verifyEvidence(id)
      setEvidence(prev => ({
        ...prev,
        integrity_status: res.data.matches ? 'intact' : 'tampered',
        current_hash: res.data.current_hash,
        last_verified_at: new Date().toISOString(),
      }))
      // Refresh hash history
      const histRes = await getEvidenceHistory(id)
      setHashHistory(histRes.data.records || [])
    } catch {
      setError('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleTranscribe = async () => {
    setTranscribing(true)
    try {
      await transcribeEvidence(id)
      // Optimistically update status (or reload evidence)
      setEvidence(prev => ({
        ...prev,
        transcription_status: 'processing'
      }))
      // Reload after a short delay to see if it started
      setTimeout(async () => {
        const evRes = await getEvidence(id)
        setEvidence(evRes.data.evidence)
      }, 1000)
    } catch (err) {
      setError('Transcription failed to start: ' + (err.response?.data?.error || err.message))
    } finally {
      setTranscribing(false)
    }
  }

  const handleLinkCase = async () => {
    if (!selectedCaseToLink) return
    setIsLinking(true)
    try {
      const res = await linkEvidenceToCase(id, selectedCaseToLink)
      setEvidence(res.data.evidence)
      setSelectedCaseToLink('')
    } catch (err) {
      setError('Failed to link case: ' + (err.response?.data?.error || err.message))
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlinkCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to unlink this case?')) return
    setIsLinking(true)
    try {
      const res = await unlinkEvidenceFromCase(id, caseId)
      setEvidence(res.data.evidence)
    } catch (err) {
      setError('Failed to unlink case: ' + (err.response?.data?.error || err.message))
    } finally {
      setIsLinking(false)
    }
  }

  const handleDownload = async () => {
    try {
      const res = await downloadEvidence(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', evidence.file_name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Download failed')
    }
  }

  const handleDownloadReport = async () => {
    setDownloadingReport(true)
    try {
      const res = await downloadEvidenceReport(id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `evidence-${evidence?.evidence_id || id}-report.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Failed to generate report')
    } finally {
      setDownloadingReport(false)
    }
  }

  const handleTransferOpen = async () => {
    try {
      const res = await getUsers()
      setUsers((res.data.users || []).filter(u => u.user_id !== user.user_id))
      setShowTransfer(true)
    } catch {
      setError('Failed to load users')
    }
  }

  const handleTransferSubmit = async (formData) => {
    try {
      await requestTransfer({
        evidence_id: id,
        to_user_id: formData.to_user_id,
        reason: formData.reason,
      })
      setShowTransfer(false)
      // Refresh evidence to show updated custodian info
      const evRes = await getEvidence(id)
      setEvidence(evRes.data.evidence)
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer request failed')
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    setShowPreview(true)
    try {
      const res = await previewEvidence(id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] || 'image/png' }))
      setPreviewUrl(url)
    } catch {
      setError('Preview not available for this file type')
      setShowPreview(false)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleClosePreview = () => {
    setShowPreview(false)
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }



  const isPreviewable =
    evidence?.file_type?.startsWith('image/') ||
    evidence?.file_type?.startsWith('audio/') ||
    evidence?.file_type?.startsWith('video/') ||
    ['application/pdf', 'text/plain', 'text/csv', 'application/json', 'text/html'].includes(evidence?.file_type) ||
    evidence?.file_name?.endsWith('.md') ||
    evidence?.file_name?.endsWith('.txt') ||
    evidence?.file_name?.toLowerCase().endsWith('.mp3') ||
    evidence?.file_name?.toLowerCase().endsWith('.mp4') ||
    evidence?.file_name?.toLowerCase().endsWith('.wav') ||
    evidence?.file_name?.toLowerCase().endsWith('.m4a')

  // Check if audio/video for transcription
  const isTranscribable =
    evidence?.file_type?.startsWith('audio/') ||
    evidence?.file_type?.startsWith('video/') ||
    evidence?.file_name?.toLowerCase().endsWith('.mp3') ||
    evidence?.file_name?.toLowerCase().endsWith('.mp4') ||
    evidence?.file_name?.toLowerCase().endsWith('.wav') ||
    evidence?.file_name?.toLowerCase().endsWith('.m4a')

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (error && !evidence) return <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md">{error}</div>
  if (!evidence) return <p className="text-gray-500">Evidence not found</p>

  return (
    <div>
      <Link to="/evidence" className="text-sm text-blue-600 hover:underline">&larr; Back to Evidence</Link>
      <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{evidence.file_name}</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm text-gray-500">ID: {evidence.evidence_id}</span>
            <div className="flex items-center gap-1.5 ml-1">
              <IntegrityBadge status={evidence.integrity_status} />
              <StatusBadge status={evidence.status} />
            </div>
          </div>
        </div>
        <div className="flex flex-nowrap items-center gap-1.5 flex-wrap">
          {hasPermission(user?.role, 'verify') && (
            <button onClick={handleVerify} disabled={verifying}
              className="group flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 hover:shadow-emerald-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 text-[11px] font-bold">
              <ShieldCheck size={14} className={verifying ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
              <span className="truncate">{verifying ? 'Verifying...' : 'Verify'}</span>
            </button>
          )}

          {isPreviewable && (
            <button onClick={handlePreview}
              className="group flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-gray-100 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all text-[11px] font-bold">
              <Eye size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
              <span>Preview</span>
            </button>
          )}
          <button onClick={handleDownload}
            className="group flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-gray-100 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all text-[11px] font-bold">
            <Download size={14} className="text-indigo-500 group-hover:scale-110 transition-transform" />
            <span>Download</span>
          </button>

          <button onClick={handleDownloadReport} disabled={downloadingReport}
            className="group flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-gray-100 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all text-[11px] font-bold disabled:opacity-50">
            <FileText size={14} className="text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="truncate">{downloadingReport ? 'Generating...' : 'Report'}</span>
          </button>

          <button onClick={() => setShowShare(true)}
            className="group flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-gray-100 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 transition-all text-[11px] font-bold">
            <Share2 size={14} className="text-purple-500 group-hover:scale-110 transition-transform" />
            <span className="truncate">Share</span>
          </button>

          {hasPermission(user?.role, 'transfer') && evidence.current_custodian_id === user?.user_id && (
            <button onClick={handleTransferOpen}
              className="group flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200/50 hover:bg-blue-700 hover:shadow-blue-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all text-[11px] font-bold">
              <ArrowRightLeft size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="truncate">Transfer</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">{error}</div>}

      {/* Low Trust Score Warning */}
      {trustScore !== null && trustScore < 60 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm animate-pulse">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-full shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800">Critical Trust Alert</h3>
              <p className="text-sm text-red-700 mt-1 leading-relaxed">
                This evidence has a Trust Score of <b>{Math.round(trustScore)}/100</b>, which is below the safe threshold of 60.
                Immediate verification of the chain of custody and file integrity is recommended to ensure document safety.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={handleVerify}
                  className="text-xs font-bold uppercase tracking-wider text-red-700 underline hover:text-red-900"
                >
                  Verify Now
                </button>
                <Link
                  to={`/audit?evidence_id=${id}`}
                  className="text-xs font-bold uppercase tracking-wider text-red-700 underline hover:text-red-900"
                >
                  Review Audit Logs
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <TransferModal
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        onSubmit={handleTransferSubmit}
        users={users}
        loading={loading}
      />

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        evidenceId={id}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <TrustScoreCard evidenceId={id} onScoreLoaded={setTrustScore} />
          {/* Metadata */}
          <div className="bg-gray-100/50 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <Info size={18} className="text-blue-600" />
              <h2 className="font-semibold text-gray-900">Evidence Metadata</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Category', value: formatCategoryLabel(evidence.category), icon: <Shield size={14} /> },
                  { label: 'Classification', value: evidence.classification, icon: <Fingerprint size={14} />, highlight: true },
                  { label: 'File Size', value: formatFileSize(evidence.file_size), icon: <FileText size={14} /> },
                  { label: 'File Type', value: evidence.file_type, icon: <Activity size={14} /> },
                  { label: 'Uploaded By', value: evidence.uploaded_by_name || evidence.uploaded_by, icon: <User size={14} /> },
                  { label: 'Current Custodian', value: evidence.custodian_name || evidence.current_custodian_id, icon: <User size={14} /> },
                  {
                    label: 'Case References',
                    value: evidence.case_numbers?.join(', ') || evidence.case_number || evidence.case_id,
                    icon: <FileText size={14} />,
                    highlight: true
                  },
                  { label: 'Upload Date', value: formatDate(evidence.created_at), icon: <Clock size={14} /> },
                  {
                    label: 'GPS Location',
                    value: evidence.location ? `${evidence.location.lat.toFixed(4)}, ${evidence.location.lng.toFixed(4)}` : 'Not Captured',
                    icon: <MapPin size={14} />,
                    isLink: !!evidence.location,
                    linkUrl: evidence.location ? `https://www.google.com/maps?q=${evidence.location.lat},${evidence.location.lng}` : null
                  },
                  { label: 'Transcription', value: evidence.transcription_status || 'Not Started', icon: <Mic size={14} />, highlight: evidence.transcription_status === 'completed' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <dt className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-2">
                      <span className="text-gray-300 group-hover:text-blue-400 transition-colors">{item.icon}</span>
                      {item.label}
                    </dt>
                    <dd className={`text-xs font-medium ${item.highlight ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full' : 'text-gray-700'}`}>
                      {item.isLink ? (
                        <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                ))}
              </div>

              {evidence.description && (
                <div className="mt-5 pt-4 border-t border-gray-50">
                  <dt className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1.5 flex items-center gap-2">
                    <FileText size={10} />
                    Description
                  </dt>
                  <dd className="text-xs text-gray-600 leading-relaxed bg-gray-100/40 p-3 rounded-lg border border-gray-100 italic">
                    "{evidence.description}"
                  </dd>
                </div>
              )}

              {evidence.tags?.length > 0 && (
                <div className="mt-4">
                  <dt className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                    <Hash size={10} />
                    Tags
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {evidence.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-blue-100/40 text-blue-600 border border-blue-100/50 rounded-md text-[10px] font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <dt className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                  <LinkIcon size={12} />
                  Cross-Case Linking
                </dt>

                <div className="space-y-2 mb-4">
                  {evidence.linked_cases?.map(c => (
                    <div key={c.case_id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 group">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-900">{c.case_number}</span>
                        <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{c.title}</span>
                      </div>
                      <button
                        onClick={() => handleUnlinkCase(c.case_id)}
                        disabled={isLinking || (evidence.linked_cases?.length <= 1)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-100 hover:text-red-600 transition-all disabled:hidden"
                        title="Remove link"
                      >
                        <Unlink size={14} />
                      </button>
                    </div>
                  ))}
                  {(!evidence.linked_cases || evidence.linked_cases.length === 0) && (
                    <div className="text-[10px] text-gray-400 italic p-2 bg-gray-50 rounded-lg border border-dashed text-center">
                      No case links found
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedCaseToLink}
                    onChange={(e) => setSelectedCaseToLink(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-blue-400"
                  >
                    <option value="">Link to case...</option>
                    {allCases
                      .filter(c => !evidence.linked_cases?.some(lc => lc.case_id === c.case_id))
                      .map(c => (
                        <option key={c.case_id} value={c.case_id}>
                          {c.case_number} - {c.title}
                        </option>
                      ))
                    }
                  </select>
                  <button
                    onClick={handleLinkCase}
                    disabled={!selectedCaseToLink || isLinking}
                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isLinking ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100/50 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              <h2 className="font-semibold text-gray-900">Integrity Verification</h2>
            </div>
            <div className="p-4 space-y-4">
              <HashDisplay label="Original Fingerprint" hash={evidence.original_hash} />

              {evidence.current_hash && (
                <HashDisplay
                  label="Last Verified Fingerprint"
                  hash={evidence.current_hash}
                  className={evidence.integrity_status === 'tampered' ? 'border-red-200 bg-red-50/30' : ''}
                />
              )}

              {evidence.last_verified_at && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100/40 p-2 rounded-lg border border-gray-50">
                  <Clock size={14} className="text-gray-400" />
                  <span>Last check: <b>{formatDate(evidence.last_verified_at)}</b></span>
                </div>
              )}

              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 flex gap-2.5">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Cryptographic hashes are unique identifiers that guarantee the file has not been altered. Any change to the content would result in a mismatch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hash History + Audit Log */}
        <div className="lg:col-span-2 space-y-6">


          <AuditSummaryCard evidenceId={id} />
          {/* Hash History */}
          <div className="bg-gray-100/50 rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[644px]">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <History size={18} className="text-blue-600" />
                <h2 className="font-semibold text-gray-900">Hash History</h2>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {hashHistory.length} Total
              </span>
            </div>
            {hashHistory.length === 0 ? (
              <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
                <Fingerprint size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm italic">No hash records available.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-100">
                <div className="divide-y divide-gray-50">
                  {hashHistory.map(r => (
                    <div key={r.record_id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${r.matches_original ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {r.matches_original ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-mono text-gray-600 flex items-center gap-2">
                              {r.hash_value.substring(0, 16)}...{r.hash_value.substring(r.hash_value.length - 8)}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(r.hash_value)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-blue-600"
                                title="Copy hash"
                              >
                                <Copy size={10} />
                              </button>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${r.event_type === 'upload' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {r.event_type}
                              </span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Clock size={10} />
                                {formatDate(r.computed_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${r.matches_original ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {r.matches_original ? 'Fingerprint Match' : 'TAMPERED'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Trail - Full Width Mobile Responsive */}
      <div className="mt-6">
        <div className="bg-gray-100/50 rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[320px]">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <h2 className="font-semibold text-gray-900">Comprehensive Audit Trail</h2>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Total {auditLogs.length} Events
            </span>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
              <FileText size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm italic">No entries in the audit trail.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-100">
              <div className="divide-y divide-gray-50">
                {auditLogs.map(log => (
                  <div key={log.log_id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-50 rounded-lg text-gray-400 shrink-0">
                        {log.action.includes('transfer') ? <ArrowRightLeft size={16} /> :
                          log.action.includes('verify') ? <ShieldCheck size={16} /> :
                            <Activity size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-snug">{log.details}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100/30">
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                            <User size={12} className="text-gray-400" />
                            {log.user_email}
                          </span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1.5 ml-auto">
                            <Clock size={12} className="text-gray-300" />
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={handleClosePreview}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Watermarked Preview</h3>
                <p className="text-xs text-gray-500 mt-0.5">This preview contains a forensic watermark</p>
              </div>
              <button onClick={handleClosePreview} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[300px]">
              {previewLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Generating watermarked preview...</p>
                </div>
              ) : previewUrl ? (
                evidence?.file_type?.startsWith('video/') || evidence?.file_name?.toLowerCase().endsWith('.mp4') ? (
                  <video src={previewUrl} controls className="max-w-full max-h-[70vh]" />
                ) : evidence?.file_type?.startsWith('audio/') || evidence?.file_name?.toLowerCase().match(/\.(mp3|wav|m4a)$/) ? (
                  <audio src={previewUrl} controls className="w-full" />
                ) : (
                  <img src={previewUrl} alt="Watermarked preview" className="max-w-full max-h-[70vh] object-contain" />
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
