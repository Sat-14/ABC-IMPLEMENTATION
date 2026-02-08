import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getEvidence, verifyEvidence, getEvidenceHistory, downloadEvidence, previewEvidence } from '../api/evidence'
import { downloadEvidenceReport } from '../api/reports'
import { getEvidenceAuditLogs } from '../api/audit'
import { requestTransfer } from '../api/transfers'
import { getUsers } from '../api/auth'
import useAuth from '../hooks/useAuth'
import { hasPermission } from '../utils/roles'
import { formatDate, formatFileSize, formatCategoryLabel } from '../utils/formatters'
import IntegrityBadge from '../components/common/IntegrityBadge'
import StatusBadge from '../components/common/StatusBadge'

export default function EvidenceDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [evidence, setEvidence] = useState(null)
  const [hashHistory, setHashHistory] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferForm, setTransferForm] = useState({ to_user_id: '', reason: '' })
  const [users, setUsers] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
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

  const handleTransferOpen = async () => {
    try {
      const res = await getUsers()
      setUsers((res.data.users || []).filter(u => u.user_id !== user.user_id))
      setShowTransfer(true)
    } catch {
      setError('Failed to load users')
    }
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    try {
      await requestTransfer({
        evidence_id: id,
        to_user_id: transferForm.to_user_id,
        reason: transferForm.reason,
      })
      setShowTransfer(false)
      setTransferForm({ to_user_id: '', reason: '' })
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

  const isImageFile = evidence?.file_type?.startsWith('image/')

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (error && !evidence) return <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md">{error}</div>
  if (!evidence) return <p className="text-gray-500">Evidence not found</p>

  return (
    <div>
      <Link to="/evidence" className="text-sm text-blue-600 hover:underline">&larr; Back to Evidence</Link>
      <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{evidence.file_name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">ID: {evidence.evidence_id}</span>
            <IntegrityBadge status={evidence.integrity_status} />
            <StatusBadge status={evidence.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission(user?.role, 'verify') && (
            <button onClick={handleVerify} disabled={verifying}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm">
              {verifying ? 'Verifying...' : 'Verify Integrity'}
            </button>
          )}
          {isImageFile && (
            <button onClick={handlePreview}
              className="px-4 py-2 bg-white border text-gray-700 rounded-md hover:bg-gray-50 text-sm">
              Preview
            </button>
          )}
          <button onClick={handleDownload}
            className="px-4 py-2 bg-white border text-gray-700 rounded-md hover:bg-gray-50 text-sm">
            Download
          </button>
          <button onClick={handleDownloadReport} disabled={downloadingReport}
            className="px-4 py-2 bg-white border text-gray-700 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50">
            {downloadingReport ? 'Generating...' : 'PDF Report'}
          </button>
          {hasPermission(user?.role, 'transfer') && evidence.current_custodian_id === user?.user_id && (
            <button onClick={handleTransferOpen}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              Transfer Custody
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">{error}</div>}

      {/* Transfer Form Modal */}
      {showTransfer && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Request Custody Transfer</h3>
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transfer To</label>
              <select value={transferForm.to_user_id}
                onChange={(e) => setTransferForm({ ...transferForm, to_user_id: e.target.value })}
                required className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="">Select user...</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea value={transferForm.reason}
                onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                required rows={2} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                Submit Request
              </button>
              <button type="button" onClick={() => setShowTransfer(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Metadata</h2>
            <dl className="space-y-3">
              {[
                ['Category', formatCategoryLabel(evidence.category)],
                ['Classification', evidence.classification],
                ['File Size', formatFileSize(evidence.file_size)],
                ['File Type', evidence.file_type],
                ['Uploaded By', evidence.uploaded_by_name || evidence.uploaded_by],
                ['Current Custodian', evidence.custodian_name || evidence.current_custodian_id],
                ['Case', evidence.case_number || evidence.case_id],
                ['Uploaded', formatDate(evidence.created_at)],
                ['Description', evidence.description || 'N/A'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{value}</dd>
                </div>
              ))}
              {evidence.tags?.length > 0 && (
                <div>
                  <dt className="text-xs text-gray-500">Tags</dt>
                  <dd className="flex flex-wrap gap-1 mt-1">
                    {evidence.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{tag}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Hash Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">Original Hash (SHA-256)</dt>
                <dd className="text-xs text-gray-900 mt-0.5 font-mono break-all">{evidence.original_hash}</dd>
              </div>
              {evidence.current_hash && (
                <div>
                  <dt className="text-xs text-gray-500">Last Verified Hash</dt>
                  <dd className="text-xs text-gray-900 mt-0.5 font-mono break-all">{evidence.current_hash}</dd>
                </div>
              )}
              {evidence.last_verified_at && (
                <div>
                  <dt className="text-xs text-gray-500">Last Verified</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{formatDate(evidence.last_verified_at)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Hash History + Audit Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hash History */}
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Hash History</h2>
            </div>
            {hashHistory.length === 0 ? (
              <p className="p-6 text-gray-500">No hash records</p>
            ) : (
              <div className="divide-y">
                {hashHistory.map(r => (
                  <div key={r.record_id} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-700 break-all">{r.hash_value}</span>
                      <span className={`text-xs font-medium ${r.matches_original ? 'text-green-600' : 'text-red-600'}`}>
                        {r.matches_original ? 'Match' : 'MISMATCH'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{r.event_type} &middot; {formatDate(r.computed_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Audit Trail</h2>
            </div>
            {auditLogs.length === 0 ? (
              <p className="p-6 text-gray-500">No audit entries</p>
            ) : (
              <div className="divide-y">
                {auditLogs.map(log => (
                  <div key={log.log_id} className="px-6 py-3">
                    <p className="text-sm text-gray-900">{log.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {log.user_email} &middot; {log.action} &middot; {formatDate(log.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                <img src={previewUrl} alt="Watermarked preview" className="max-w-full max-h-[70vh] object-contain" />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
