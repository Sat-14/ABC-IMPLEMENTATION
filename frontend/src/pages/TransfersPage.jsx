import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTransfers, approveTransfer, rejectTransfer, completeTransfer, cancelTransfer } from '../api/transfers'
import useAuth from '../hooks/useAuth'
import { formatDate } from '../utils/formatters'
import StatusBadge from '../components/common/StatusBadge'
import Pagination from '../components/common/Pagination'

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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Custody Transfers</h1>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {['incoming', 'outgoing'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t === 'incoming' ? 'Incoming' : 'Outgoing'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border">
        {loading ? (
          <p className="p-6 text-gray-500">Loading transfers...</p>
        ) : transfers.length === 0 ? (
          <p className="p-6 text-gray-500">No {tab} transfers</p>
        ) : (
          <div className="divide-y">
            {transfers.map(t => (
              <div key={t.transfer_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/evidence/${t.evidence_id}`} className="text-blue-600 hover:underline text-sm font-medium">
                      {t.evidence_name || t.evidence_id}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      {t.from_user_name || t.from_user_id} &rarr; {t.to_user_name || t.to_user_id}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Reason: {t.reason}</p>
                    <p className="text-xs text-gray-500">Requested: {formatDate(t.requested_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    {/* Action buttons based on tab and status */}
                    {tab === 'incoming' && t.status === 'pending' && (
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => handleAction(t.transfer_id, 'approve')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                          Approve
                        </button>
                        <button onClick={() => handleAction(t.transfer_id, 'reject')}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                          Reject
                        </button>
                      </div>
                    )}
                    {tab === 'outgoing' && t.status === 'pending' && (
                      <button onClick={() => handleAction(t.transfer_id, 'cancel')}
                        className="px-3 py-1 border rounded text-xs hover:bg-gray-50 ml-2">
                        Cancel
                      </button>
                    )}
                    {tab === 'outgoing' && t.status === 'approved' && (
                      <button onClick={() => handleAction(t.transfer_id, 'complete')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 ml-2">
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
