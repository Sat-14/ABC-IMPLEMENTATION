import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, FolderOpen, ArrowRightLeft, Upload, Activity, Clock, Shield, BarChart3, HardDrive, AlertTriangle } from 'lucide-react'
import {
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import useAuth from '../hooks/useAuth'
import { getEvidenceList, getAnalytics } from '../api/evidence'
import { getCases } from '../api/cases'
import { getTransfers } from '../api/transfers'
import { getAuditLogs } from '../api/audit'
import { ROLE_LABELS, hasPermission } from '../utils/roles'
import { formatDate, formatFileSize } from '../utils/formatters'
import StatusBadge from '../components/common/StatusBadge'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'

const CATEGORY_COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#F97316', '#6366F1']
const INTEGRITY_COLORS = { intact: '#10B981', tampered: '#EF4444', unverified: '#F59E0B' }
const TRANSFER_COLORS = { completed: '#10B981', pending: '#F59E0B', approved: '#3B82F6', rejected: '#EF4444', cancelled: '#94A3B8' }

function ChartCard({ title, icon: Icon, children }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary-600" />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </Card>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border-subtle rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white border border-border-subtle rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-text-primary capitalize">{d.name?.replace(/_/g, ' ')}</p>
      <p style={{ color: d.payload.fill }} className="font-medium">{d.value} items</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ evidence: 0, cases: 0, pendingTransfers: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [evidenceRes, casesRes, transfersRes, auditRes, analyticsRes] = await Promise.all([
          getEvidenceList({ page: 1, per_page: 1 }),
          getCases({ page: 1, per_page: 1 }),
          getTransfers({ status: 'pending', page: 1, per_page: 1 }),
          getAuditLogs({ page: 1, per_page: 5 }),
          getAnalytics(),
        ])
        setStats({
          evidence: evidenceRes.data.total || 0,
          cases: casesRes.data.total || 0,
          pendingTransfers: transfersRes.data.total || 0,
        })
        setRecentActivity(auditRes.data.logs || [])
        setAnalytics(analyticsRes.data)
      } catch (error) {
        console.error("Dashboard load failed", error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const summary = analytics?.summary || {}

  const statCards = [
    { label: 'Total Evidence', value: stats.evidence, link: '/evidence', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Open Cases', value: stats.cases, link: '/cases', icon: FolderOpen, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Pending Transfers', value: stats.pendingTransfers, link: '/transfers', icon: ArrowRightLeft, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Total Storage', value: formatFileSize(summary.total_storage_bytes || 0), link: '/evidence', icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 to-slate-900 border border-white/10 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-20 mix-blend-overlay">
          <Shield size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Badge variant="primary" className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur-md shadow-sm">Digital Chain of Custody</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white drop-shadow-sm">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">{user?.full_name}</span>
          </h1>
          <p className="text-blue-100/80 text-base md:text-lg mb-8 max-w-lg leading-relaxed">
            You are logged in as <span className="text-white font-semibold">{ROLE_LABELS[user?.role]}</span>.
            Here is what's happening in your department today.
          </p>

          <div className="flex flex-wrap gap-4">
            {hasPermission(user?.role, 'upload') && (
              <Link to="/evidence/upload">
                <Button size="lg" className="shadow-xl shadow-blue-900/20 border border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                  <Upload className="w-5 h-5" />
                  Upload Evidence
                </Button>
              </Link>
            )}
            <Link to="/cases">
              <Button size="lg" variant="secondary" className="bg-white text-blue-950 hover:bg-blue-50 border-transparent shadow-lg">
                View Active Cases
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <Link key={card.label} to={card.link} className="block group">
            <Card hoverEffect className="h-full flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon size={24} />
                </div>
                {idx === 2 && card.value > 0 && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
                {summary.tampered_count > 0 && idx === 0 && (
                  <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    {summary.tampered_count} tampered
                  </div>
                )}
              </div>
              <div>
                <p className="text-text-secondary text-sm font-medium mb-1">{card.label}</p>
                <p className="text-4xl font-bold text-text-primary tracking-tight group-hover:scale-105 transition-transform origin-left">
                  {loading ? '-' : card.value}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts Row 1 */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evidence by Category */}
          <ChartCard title="Evidence by Category" icon={BarChart3}>
            {analytics.evidence_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={analytics.evidence_by_category}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics.evidence_by_category.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-text-secondary capitalize">{value.replace(/_/g, ' ')}</span>}
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-text-tertiary text-sm">No evidence data</div>
            )}
          </ChartCard>

          {/* Integrity Status */}
          <ChartCard title="Evidence Integrity Status" icon={Shield}>
            {analytics.evidence_by_integrity.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={analytics.evidence_by_integrity}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics.evidence_by_integrity.map((entry) => (
                      <Cell key={entry.name} fill={INTEGRITY_COLORS[entry.name] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-text-secondary capitalize">{value}</span>}
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-text-tertiary text-sm">No integrity data</div>
            )}
          </ChartCard>
        </div>
      )}

      {/* Charts Row 2 */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Uploads Over Time */}
          <ChartCard title="Evidence Uploads (Last 30 Days)" icon={Upload}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analytics.uploads_over_time}>
                <defs>
                  <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="uploads" stroke="#3B82F6" fill="url(#uploadGrad)" strokeWidth={2} name="Uploads" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Weekly Activity */}
          <ChartCard title="Activity (Last 7 Days)" icon={Activity}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.activity_by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="actions" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Actions" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Charts Row 3 */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transfers by Status */}
          <ChartCard title="Transfers by Status" icon={ArrowRightLeft}>
            {analytics.transfers_by_status.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.transfers_by_status} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94A3B8" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94A3B8" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Count">
                    {analytics.transfers_by_status.map((entry) => (
                      <Cell key={entry.name} fill={TRANSFER_COLORS[entry.name] || '#94A3B8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-text-tertiary text-sm">No transfer data</div>
            )}
          </ChartCard>

          {/* Cases by Status */}
          <ChartCard title="Cases by Status" icon={FolderOpen}>
            {analytics.cases_by_status.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.cases_by_status}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics.cases_by_status.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.name === 'open' ? '#10B981' : entry.name === 'closed' ? '#94A3B8' : CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-text-secondary capitalize">{value}</span>}
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-text-tertiary text-sm">No case data</div>
            )}
          </ChartCard>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Activity className="text-primary-500" />
              Recent Activity
            </h2>
            <Link to="/audit">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-text-secondary">No recent activity found</p>
              </Card>
            ) : (
              recentActivity.map((log) => (
                <div key={log.log_id} className="group relative pl-8 pb-4 last:pb-0">
                  <div className="absolute left-[11px] top-3 bottom-0 w-px bg-border-subtle group-last:hidden"></div>
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-bg-primary border border-border-subtle flex items-center justify-center group-hover:border-primary-500/50 group-hover:scale-110 transition-all">
                    <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary group-hover:bg-primary-500 transition-colors"></div>
                  </div>

                  <Card className="hover:bg-bg-tertiary transition-colors p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-text-primary font-medium mb-1">{log.details}</p>
                        <div className="flex items-center gap-3 text-xs text-text-tertiary">
                          <span className="text-primary-500/80 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
                            {log.user_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={log.action.split('_').pop()} />
                    </div>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary-900/10 to-slate-900/10 border-primary-500/20">
            <h3 className="font-semibold text-text-primary mb-2">Did you know?</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              All evidence actions are cryptographically hashed and chained.
              Any tampering attempt will break the chain of custody verification.
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold text-text-primary mb-4">Quick Navigation</h3>
            <div className="space-y-2">
              <Link to="/evidence" className="block p-3 rounded-xl bg-bg-tertiary hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors text-sm">
                Browse Evidence Library
              </Link>
              <Link to="/audit" className="block p-3 rounded-xl bg-bg-tertiary hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors text-sm">
                Audit Logs & Reports
              </Link>
              <Link to="/transfers" className="block p-3 rounded-xl bg-bg-tertiary hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors text-sm">
                Chain of Custody
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
