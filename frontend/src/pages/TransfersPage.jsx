import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, Check, X, ArrowRight, Ban, Clock } from 'lucide-react'
import { getTransfers, approveTransfer, rejectTransfer, completeTransfer, cancelTransfer } from '../api/transfers'
import useAuth from '../hooks/useAuth'
import { formatDate } from '../utils/formatters'
import StatusBadge from '../components/common/StatusBadge'
import Pagination from '../components/common/Pagination'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Badge } from '../components/common/Badge'

export default function TransfersPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('incoming')
  const [transfers, setTransfers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTransfers = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 10 }
      if (tab === 'incoming') params.to_user = user.user_id
      else params.from_user = user.user_id
      const res = await getTransfers(params)
      setTransfers(res.data.transfers || [])
      setTotalPages(res.data.total_pages || 1)
    } catch {
      setError('Failed to load transfers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setPage(1) }, [tab])
  useEffect(() => { loadTransfers() }, [page, tab])

  const handleAction = async (transferId, action) => {
    try {
      const actions = { approve: approveTransfer, reject: rejectTransfer, complete: completeTransfer, cancel: cancelTransfer }
      await actions[action](transferId)
      loadTransfers()
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} transfer`)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 -m-6 p-6 space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-[32px] font-bold text-[#0F172A] leading-tight tracking-tight">Chain of Custody</h1>
        <p className="text-[16px] text-[#64748B] mt-1">Manage physical custody transfers of evidence</p>
      </div>

      <div className="max-w-7xl mx-auto w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        {/* Tabs - Segmented Control */}
        <div className="bg-slate-200/50 p-1 rounded-xl inline-flex border border-slate-200/60 shadow-sm shrink-0">
          {['incoming', 'outgoing'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t
                ? 'bg-white text-[#0F172A] shadow-md border border-slate-100'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/40'
                }`}
            >
              {t === 'incoming' ? 'Incoming Requests' : 'Outgoing Requests'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
              <p className="mt-2 text-slate-500">Loading transfers...</p>
            </div>
          ) : transfers.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <ArrowLeftRight className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-[#1E293B] mb-1">No {tab} transfers</h3>
              <p className="text-[#64748B]">Nothing to review at the moment.</p>
            </div>
          ) : (
            transfers.map(t => (
              <div key={t.transfer_id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow relative overflow-hidden group">
                {/* Accent stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.status === 'pending' ? 'bg-amber-400' :
                    t.status === 'approved' ? 'bg-blue-500' :
                      t.status === 'completed' ? 'bg-green-500' : 'bg-slate-300'
                  }`} />

                <div className="flex flex-col gap-4 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl shrink-0 ${t.status === 'pending' ? 'bg-amber-50 text-amber-500' :
                          t.status === 'approved' ? 'bg-blue-50 text-blue-500' :
                            'bg-slate-50 text-slate-500'
                        }`}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <Link to={`/evidence/${t.evidence_id}`} className="text-lg font-bold text-[#0F172A] hover:text-[#3B82F6] transition-colors leading-tight">
                          {t.evidence_name || t.evidence_id}
                        </Link>
                        <div className="flex items-center gap-2 mt-1.5 text-[#64748B] text-sm">
                          <span className="font-medium">{t.from_user_name || 'System'}</span>
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                          <span className="font-medium">{t.to_user_name || 'You'}</span>
                        </div>
                        <div className="mt-4 bg-[#F8FAFC] rounded-lg px-4 py-3 text-sm text-[#475569] border border-[#E2E8F0] inline-block">
                          <span className="text-[#94A3B8] font-bold uppercase text-[10px] tracking-wider mr-2">Transfer Reason</span>
                          {t.reason}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={t.status} />
                      <span className="text-xs font-medium text-[#94A3B8]">{formatDate(t.requested_at)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 mt-2 gap-3">
                    {/* Action buttons based on tab and status */}
                    {tab === 'incoming' && t.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(t.transfer_id, 'reject')}
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(t.transfer_id, 'approve')}
                          className="px-6 py-2 rounded-lg text-sm font-semibold bg-[#3B82F6] text-white shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Approve Transfer
                        </button>
                      </>
                    )}
                    {tab === 'outgoing' && t.status === 'pending' && (
                      <button
                        onClick={() => handleAction(t.transfer_id, 'cancel')}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4" /> Cancel Request
                      </button>
                    )}
                    {tab === 'outgoing' && t.status === 'approved' && (
                      <button
                        onClick={() => handleAction(t.transfer_id, 'complete')}
                        className="px-6 py-2 rounded-lg text-sm font-semibold bg-[#3B82F6] text-white shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Complete Handover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
