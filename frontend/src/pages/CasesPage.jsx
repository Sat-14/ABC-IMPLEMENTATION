import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Folder, Calendar, AlertTriangle, Clock } from 'lucide-react'
import { getCases, createCase } from '../api/cases'
import useAuth from '../hooks/useAuth'
import { hasPermission } from '../utils/roles'
import { formatDate } from '../utils/formatters'
import StatusBadge from '../components/common/StatusBadge'
import Pagination from '../components/common/Pagination'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input } from '../components/common/Input'
import { Badge } from '../components/common/Badge'

export default function CasesPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [closingReason, setClosingReason] = useState('')
  const [isClosing, setIsClosing] = useState(false)

  const loadCases = async () => {
    setLoading(true)
    try {
      const res = await getCases({ page, per_page: 10, status: statusFilter })
      setCases(res.data.cases || [])
      setTotalPages(res.data.total_pages || 1)
    } catch {
      setError('Failed to load cases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCases() }, [page, statusFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createCase(form)
      setShowForm(false)
      setForm({ title: '', description: '' })
      loadCases()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create case')
    }
  }

  const handleCloseCase = async (e) => {
    e.preventDefault()
    if (!selectedCase || !closingReason) return
    setIsClosing(true)
    try {
      const { updateCase } = await import('../api/cases')
      await updateCase(selectedCase.case_id, {
        status: 'closed',
        closing_reason: closingReason
      })
      setShowCloseModal(false)
      setClosingReason('')
      setSelectedCase(null)
      loadCases()
    } catch (err) {
      setError('Failed to close case')
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Case Management</h1>
          <p className="text-text-secondary mt-1">Manage and track digital investigation cases</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-bg-secondary p-1 rounded-xl flex items-center gap-1 mr-2">
            <button
              onClick={() => { setStatusFilter('open'); setPage(1); }}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === 'open' ? 'bg-white text-primary-600 shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              Active
            </button>
            <button
              onClick={() => { setStatusFilter('closed'); setPage(1); }}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === 'closed' ? 'bg-white text-primary-600 shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              Closed
            </button>
          </div>
          {hasPermission(user?.role, 'upload') && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4" />
              New Case
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {error}
        </div>
      )}

      {showForm && (
        <Card className="mb-8 border-primary-500/20 bg-primary-50/50">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Create New Case</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Case Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Operation Blue Sky"
              className="bg-white"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary ml-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-white text-text-primary rounded-xl border border-border-subtle px-4 py-2.5 outline-none transition-all duration-200 focus:border-primary-500/50 focus:bg-white focus:ring-1 focus:ring-primary-500/50 placeholder:text-text-tertiary"
                placeholder="Brief details about the case..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Case
              </Button>
            </div>
          </form>
        </Card>
      )}

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
                You are about to finalize and close case <span className="font-mono font-bold text-[#111827] bg-gray-100 px-2 py-0.5 rounded">{selectedCase?.case_number}</span>.
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
                  <Button type="button" variant="ghost" onClick={() => { setShowCloseModal(false); setSelectedCase(null); }} className="hover:bg-gray-100 rounded-xl px-6">
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

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-text-secondary">Loading cases...</div>
        ) : cases.length === 0 ? (
          <Card className="text-center py-16 bg-white/50">
            <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">No {statusFilter} cases found</h3>
            <p className="text-text-secondary">All caught up!</p>
          </Card>
        ) : (
          cases.map(c => (
            <Card
              key={c.case_id}
              hoverEffect
              className={`group transition-all duration-300 ${c.status === 'closed' ? 'bg-bg-tertiary/20 grayscale-[0.3] border-dashed opacity-90' : 'bg-white shadow-sm'}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl shrink-0 transition-colors duration-300 ${c.status === 'closed' ? 'bg-gray-200/50 text-gray-500' : 'bg-primary-50 text-primary-600 group-hover:bg-primary-100'}`}>
                    <Folder className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link to={`/cases/${c.case_id}`} className={`text-lg font-bold tracking-tight hover:text-primary-600 transition-colors truncate ${c.status === 'closed' ? 'text-text-secondary' : 'text-text-primary'}`}>
                        {c.title}
                      </Link>
                      <Badge variant="default" className="font-mono text-[10px] opacity-60 bg-bg-tertiary/50">
                        {c.case_number}
                      </Badge>
                      {c.status === 'closed' && (
                        <StatusBadge status="closed" />
                      )}
                    </div>
                    <p className="text-text-secondary text-sm line-clamp-1 opacity-80">{c.description || 'No description provided'}</p>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-[11px] font-medium text-text-tertiary">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        Created {formatDate(c.created_at)}
                      </span>
                      {c.status === 'closed' && (
                        <>
                          <span className="flex items-center gap-1.5 text-red-600/80">
                            <Clock className="w-3.5 h-3.5" />
                            Closed {formatDate(c.closed_at)}
                          </span>
                          <span className="flex items-center gap-1.5 text-text-secondary">
                            <Plus className="w-3.5 h-3.5 rotate-45 opacity-70" />
                            By {c.closed_by_name}
                          </span>
                        </>
                      )}
                    </div>
                    {c.status === 'closed' && c.closing_reason && (
                      <div className="mt-3 text-xs bg-white/40 backdrop-blur-sm p-3 rounded-xl border border-border-subtle italic text-text-secondary leading-relaxed shadow-sm">
                        <span className="text-primary-600 font-bold not-italic mr-1">Reason:</span>
                        "{c.closing_reason}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 md:self-center pl-14 md:pl-0">
                  {c.status !== 'closed' && hasPermission(user?.role, 'upload') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-bold"
                      onClick={() => { setSelectedCase(c); setShowCloseModal(true); }}
                    >
                      Close Case
                    </Button>
                  )}
                  <Link to={`/cases/${c.case_id}`}>
                    <Button variant="secondary" size="sm" className="rounded-lg shadow-sm border-border-subtle">View Details</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
