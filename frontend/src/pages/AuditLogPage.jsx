import { useState, useEffect } from 'react'
import { Shield, Search, Filter, CheckCircle2, AlertCircle, Clock, Mail, Activity, Hash, ArrowLeftRight } from 'lucide-react'
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
    <div className="min-h-screen bg-[#F8FAFC] pb-20 -m-6 p-6 space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#0F172A] leading-tight tracking-tight">Audit Log</h1>
          <p className="text-[16px] text-[#64748B] mt-1">Immutable record of system and evidence interactions</p>
        </div>
        {hasPermission(user?.role, 'admin') && (
          <button
            onClick={handleVerifyChain}
            disabled={verifyingChain}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {verifyingChain ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 text-[#3B82F6]" />
            )}
            {verifyingChain ? 'Verifying Chain...' : 'Verify Chain Integrity'}
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto w-full space-y-6">
        {chainStatus && (
          <div className={`p-4 rounded-xl border-l-4 animate-in slide-in-from-top duration-300 ${chainStatus.intact
              ? 'bg-[#F0FDF4] border-[#22C55E] text-[#166534]'
              : 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]'
            }`}>
            <div className="flex items-center gap-3">
              {chainStatus.intact ? (
                <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#EF4444]" />
              )}
              <p className="text-sm font-medium">
                {chainStatus.intact
                  ? `Audit chain intact. ${chainStatus.total_entries} entries verified.`
                  : `Chain integrity BROKEN at entry #${chainStatus.broken_at || 'unknown'}. ${chainStatus.error || ''}`
                }
              </p>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[#64748B] mr-2">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>

          <div className="relative">
            <select
              value={filters.entity_type}
              onChange={(e) => { setFilters({ ...filters, entity_type: e.target.value }); setPage(1) }}
              className="pl-3 pr-8 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#334155] appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#3B82F6] transition-all cursor-pointer"
            >
              <option value="">All Entities</option>
              <option value="evidence">Evidence</option>
              <option value="case">Case</option>
              <option value="transfer">Transfer</option>
              <option value="user">User</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={filters.action}
              onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1) }}
              className="pl-3 pr-8 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#334155] appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#3B82F6] transition-all cursor-pointer"
            >
              <option value="">All Actions</option>
              {['evidence_uploaded', 'evidence_viewed', 'evidence_verified', 'evidence_downloaded',
                'transfer_requested', 'transfer_approved', 'transfer_completed',
                'case_created', 'user_registered', 'user_login'].map(a => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>

        {/* Logs Table Container */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
              <p className="mt-4 text-slate-400 font-medium">Retrieving audit chain...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-[#1E293B] mb-1">No logs found</h3>
              <p className="text-[#64748B]">Adjust your filters to see more entries.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Timestamp</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Action</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Details</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Chain Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {logs.map(log => (
                    <tr key={log.log_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span className="text-xs font-medium text-[#475569]">{formatDate(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span className="text-sm text-[#334155] font-medium">{log.user_email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#64748B] max-w-sm truncate group-hover:text-[#334155] transition-colors">{log.details}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2 group/hash">
                          <span className="text-[11px] font-mono text-[#94A3B8] bg-slate-50 px-2 py-0.5 rounded border border-slate-100 group-hover/hash:text-[#3B82F6] transition-colors">
                            {log.hash_of_entry?.slice(0, 16)}...
                          </span>
                          <Hash className="w-3 h-3 text-slate-300" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
