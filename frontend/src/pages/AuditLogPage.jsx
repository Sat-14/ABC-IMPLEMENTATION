import { useState, useEffect } from 'react'
import { getAuditLogs, verifyAuditChain } from '../api/audit'
import useAuth from '../hooks/useAuth'
import { hasPermission } from '../utils/roles'
import { formatDate } from '../utils/formatters'
import Pagination from '../components/common/Pagination'

export default function AuditLogPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', entity_type: '' })
  const [chainStatus, setChainStatus] = useState(null)
  const [verifyingChain, setVerifyingChain] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = { page, per_page: 20 }
        if (filters.action) params.action = filters.action
        if (filters.entity_type) params.entity_type = filters.entity_type
        const res = await getAuditLogs(params)
        setLogs(res.data.logs || [])
        setTotalPages(res.data.total_pages || 1)
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, filters])

  const handleVerifyChain = async () => {
    setVerifyingChain(true)
    try {
      const res = await verifyAuditChain()
      setChainStatus(res.data)
    } catch {
      setChainStatus({ intact: false, error: 'Verification failed' })
    } finally {
      setVerifyingChain(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        {hasPermission(user?.role, 'admin') && (
          <button onClick={handleVerifyChain} disabled={verifyingChain}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm">
            {verifyingChain ? 'Verifying...' : 'Verify Chain Integrity'}
          </button>
        )}
      </div>

      {chainStatus && (
        <div className={`px-4 py-3 rounded-md text-sm mb-4 ${
          chainStatus.intact ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {chainStatus.intact
            ? `Audit chain intact. ${chainStatus.total_entries} entries verified.`
            : `Chain integrity BROKEN at entry #${chainStatus.broken_at || 'unknown'}. ${chainStatus.error || ''}`
          }
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-4 flex flex-wrap gap-3">
        <select value={filters.entity_type}
          onChange={(e) => { setFilters({ ...filters, entity_type: e.target.value }); setPage(1) }}
          className="px-3 py-2 border rounded-md text-sm">
          <option value="">All Entities</option>
          <option value="evidence">Evidence</option>
          <option value="case">Case</option>
          <option value="transfer">Transfer</option>
          <option value="user">User</option>
        </select>
        <select value={filters.action}
          onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1) }}
          className="px-3 py-2 border rounded-md text-sm">
          <option value="">All Actions</option>
          {['evidence_uploaded', 'evidence_viewed', 'evidence_verified', 'evidence_downloaded',
            'transfer_requested', 'transfer_approved', 'transfer_completed',
            'case_created', 'user_registered', 'user_login'].map(a => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <p className="p-6 text-gray-500">Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-gray-500">No audit logs found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <tr key={log.log_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.user_email}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      <span className="px-2 py-0.5 bg-gray-100 rounded">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{log.details}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.hash_of_entry?.slice(0, 12)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
