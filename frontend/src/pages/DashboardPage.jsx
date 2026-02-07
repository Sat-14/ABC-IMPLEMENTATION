import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getEvidenceList } from '../api/evidence'
import { getCases } from '../api/cases'
import { getTransfers } from '../api/transfers'
import { getAuditLogs } from '../api/audit'
import { ROLE_LABELS, hasPermission } from '../utils/roles'
import { formatDate } from '../utils/formatters'
import StatusBadge from '../components/common/StatusBadge'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ evidence: 0, cases: 0, pendingTransfers: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [evidenceRes, casesRes, transfersRes, auditRes] = await Promise.all([
          getEvidenceList({ page: 1, per_page: 1 }),
          getCases({ page: 1, per_page: 1 }),
          getTransfers({ status: 'pending', page: 1, per_page: 1 }),
          getAuditLogs({ page: 1, per_page: 5 }),
        ])
        setStats({
          evidence: evidenceRes.data.total || 0,
          cases: casesRes.data.total || 0,
          pendingTransfers: transfersRes.data.total || 0,
        })
        setRecentActivity(auditRes.data.logs || [])
      } catch {
        // Dashboard stats are best-effort
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const statCards = [
    { label: 'Total Evidence', value: stats.evidence, link: '/evidence', color: 'blue' },
    { label: 'Open Cases', value: stats.cases, link: '/cases', color: 'green' },
    { label: 'Pending Transfers', value: stats.pendingTransfers, link: '/transfers', color: 'yellow' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Welcome, {user?.full_name} ({ROLE_LABELS[user?.role]})
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statCards.map(card => (
          <Link
            key={card.label}
            to={card.link}
            className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading ? '...' : card.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {hasPermission(user?.role, 'upload') && (
            <Link to="/evidence/upload" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              Upload Evidence
            </Link>
          )}
          <Link to="/cases" className="px-4 py-2 bg-white border text-gray-700 rounded-md hover:bg-gray-50 text-sm">
            View Cases
          </Link>
          <Link to="/evidence" className="px-4 py-2 bg-white border text-gray-700 rounded-md hover:bg-gray-50 text-sm">
            Browse Evidence
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div className="bg-white rounded-lg border">
          {loading ? (
            <p className="p-4 text-gray-500">Loading...</p>
          ) : recentActivity.length === 0 ? (
            <p className="p-4 text-gray-500">No recent activity</p>
          ) : (
            <div className="divide-y">
              {recentActivity.map(log => (
                <div key={log.log_id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.details}</p>
                    <p className="text-xs text-gray-500">
                      by {log.user_email} &middot; {formatDate(log.timestamp)}
                    </p>
                  </div>
                  <StatusBadge status={log.action.split('_').pop()} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
