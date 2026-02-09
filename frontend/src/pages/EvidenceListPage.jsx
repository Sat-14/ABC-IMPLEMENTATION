import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Upload, Search, Filter, FileText, Image, Video, Music, Globe, Database, HardDrive, Mail, Briefcase, ChevronRight, ArrowLeft, Shield, CheckSquare, Download } from 'lucide-react'
import { getEvidenceList, bulkVerify, exportEvidenceCSV } from '../api/evidence'
import { getCases } from '../api/cases'
import useAuth from '../hooks/useAuth'
import { hasPermission } from '../utils/roles'
import { formatDate, formatFileSize, truncateHash, formatCategoryLabel } from '../utils/formatters'
import IntegrityBadge from '../components/common/IntegrityBadge'
import StatusBadge from '../components/common/StatusBadge'
import Pagination from '../components/common/Pagination'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { Input, Select } from '../components/common/Input'
import { Badge } from '../components/common/Badge'

const CATEGORY_ICONS = {
  disk_image: HardDrive,
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  log: Database,
  email: Mail,
  network_capture: Globe,
  other: FileText
}

export default function EvidenceListPage() {
  const { user } = useAuth()
  const [evidence, setEvidence] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ category: '', status: 'active' })
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState(null)
  const [fetchingCases, setFetchingCases] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [bulkVerifying, setBulkVerifying] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const location = useLocation()

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === evidence.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(evidence.map(e => e.evidence_id)))
    }
  }

  async function handleBulkVerify() {
    if (selected.size === 0) return
    setBulkVerifying(true)
    setBulkResult(null)
    try {
      const res = await bulkVerify([...selected])
      setBulkResult(res.data.summary)
      setSelected(new Set())
      // Reload evidence list to show updated statuses
      const params = { page, per_page: 10, case_id: selectedCase.case_id }
      if (search) params.search = search
      if (filters.category) params.category = filters.category
      if (filters.status) params.status = filters.status
      const eRes = await getEvidenceList(params)
      setEvidence(eRes.data.evidence || [])
    } catch {
      alert('Bulk verification failed')
    } finally {
      setBulkVerifying(false)
    }
  }

  useEffect(() => {
    async function loadCases() {
      setFetchingCases(true)
      try {
        const res = await getCases({ per_page: 100 })
        const fetchedCases = res.data.cases || []
        setCases(fetchedCases)

        // Auto-select if passed from external link (e.g. Case Detail)
        const stateCase = location.state?.selectedCase
        if (stateCase) {
          setSelectedCase(stateCase)
        }
      } catch (err) {
        console.error('Failed to load cases:', err)
      } finally {
        setFetchingCases(false)
      }
    }
    loadCases()
  }, [location.state])

  useEffect(() => {
    if (!selectedCase) return

    async function load() {
      setLoading(true)
      try {
        const params = { page, per_page: 10, case_id: selectedCase.case_id }
        if (search) params.search = search
        if (filters.category) params.category = filters.category
        if (filters.status) params.status = filters.status
        const res = await getEvidenceList(params)
        setEvidence(res.data.evidence || [])
        setTotalPages(res.data.total_pages || 1)
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, search, filters, selectedCase])

  if (fetchingCases) {
    return <div className="flex items-center justify-center py-20 text-text-tertiary">Loading workspace...</div>
  }

  if (cases.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <Card className="text-center p-12 border-2 border-dashed border-border-subtle bg-bg-secondary/30">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Briefcase className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">No Cases Active</h2>
          <p className="text-text-secondary text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Evidence must be associated with a case. Create your first case to begin managing digital evidence.
          </p>
          <Link to="/cases">
            <Button size="lg" className="px-8 h-14 rounded-2xl font-bold shadow-xl shadow-primary-500/20 active:scale-95 transition-all">
              Initialize First Case
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (!selectedCase) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight">Select a Case</h1>
          <p className="text-text-secondary mt-2 text-lg">Choose a specific investigation to view its evidence library</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map(c => (
            <Card
              key={c.case_id}
              hoverEffect
              onClick={() => setSelectedCase(c)}
              className="cursor-pointer group p-0 overflow-hidden border border-border-subtle hover:border-primary-500/50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-1 rounded">
                    {c.case_number}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${c.status === 'open' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-400'}`} />
                </div>
                <h3 className="text-xl font-bold text-text-primary group-hover:text-primary-600 transition-colors mb-2 line-clamp-1">{c.title}</h3>
                <p className="text-sm text-text-tertiary line-clamp-2 mb-6 h-10">{c.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-auto">
                  <span className="text-xs text-text-tertiary font-medium">Click to enter library</span>
                  <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:translate-x-1 transition-transform group-hover:text-primary-600" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setSelectedCase(null); setEvidence([]); }}
            className="hover:bg-bg-secondary rounded-xl h-12 w-12 border border-border-subtle"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              Evidence Library
              <span className="mx-2 md:mx-3 text-text-tertiary font-light">/</span>
              <span className="text-primary-600 font-extrabold">{selectedCase.case_number}</span>
            </h1>
            <p className="text-text-secondary mt-0.5 font-medium">{selectedCase.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await exportEvidenceCSV(selectedCase?.case_id)
                const url = window.URL.createObjectURL(new Blob([res.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `evidence-${selectedCase?.case_number || 'all'}.csv`)
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)
              } catch { /* silent */ }
            }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          {hasPermission(user?.role, 'upload') && (
            <Link to="/evidence/upload">
              <Button>
                <Upload className="w-4 h-4" />
                Upload Evidence
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-bg-secondary/50 border border-border-subtle shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Input
              icon={Search}
              placeholder="Search by file name or ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="w-full md:w-72">
            <Select
              icon={Filter}
              value={filters.category}
              onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1) }}
            >
              <option value="">All Categories</option>
              {['disk_image', 'document', 'image', 'video', 'audio', 'log', 'email', 'network_capture', 'other'].map(c => (
                <option key={c} value={c}>{formatCategoryLabel(c)}</option>
              ))}
            </Select>
          </div>
          <div className="w-full md:w-64">
            <Select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="disposed">Disposed</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {evidence.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-primary-600 transition-colors"
          >
            <CheckSquare className={`w-4 h-4 ${selected.size === evidence.length ? 'text-primary-600' : ''}`} />
            {selected.size === evidence.length ? 'Deselect All' : 'Select All'}
          </button>
          {selected.size > 0 && (
            <>
              <Badge variant="primary">{selected.size} selected</Badge>
              {hasPermission(user?.role, 'verify') && (
                <Button size="sm" variant="outline" onClick={handleBulkVerify} disabled={bulkVerifying}>
                  <Shield className="w-3.5 h-3.5" />
                  {bulkVerifying ? 'Verifying...' : 'Bulk Verify'}
                </Button>
              )}
            </>
          )}
          {bulkResult && (
            <div className="text-xs font-medium ml-auto">
              <span className="text-green-600">{bulkResult.intact} intact</span>
              {bulkResult.tampered > 0 && <span className="text-red-600 ml-2">{bulkResult.tampered} tampered</span>}
              <span className="text-text-tertiary ml-2">({bulkResult.total} verified)</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-text-tertiary">Loading evidence...</div>
        ) : evidence.length === 0 ? (
          <Card className="text-center py-16 bg-bg-secondary/50">
            <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 border border-border-subtle">
              <Search className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">No evidence found</h3>
            <p className="text-text-secondary">Try adjusting your search criteria.</p>
          </Card>
        ) : (
          evidence.map(e => {
            const Icon = CATEGORY_ICONS[e.category] || FileText
            return (
              <Card key={e.evidence_id} hoverEffect className="group py-4 px-5 border border-border-subtle hover:border-primary-500/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selected.has(e.evidence_id)}
                      onChange={() => toggleSelect(e.evidence_id)}
                      className="mt-3 w-4 h-4 rounded border-border-subtle text-primary-600 focus:ring-primary-500 shrink-0 cursor-pointer"
                    />
                    <div className="p-2.5 rounded-xl bg-bg-secondary text-text-secondary shrink-0 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors border border-border-subtle">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/evidence/${e.evidence_id}`} className="font-bold text-text-primary hover:text-primary-600 transition-colors line-clamp-1 tracking-tight">
                          {e.file_name}
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary font-medium">
                        <span className="bg-bg-tertiary px-2 py-0.5 rounded-md border border-border-subtle text-text-tertiary">
                          {formatFileSize(e.file_size)}
                        </span>
                        <span className="uppercase tracking-wider text-[10px] font-bold text-text-tertiary">{formatCategoryLabel(e.category)}</span>
                        <span className="font-mono text-text-tertiary opacity-70" title={e.original_hash}>
                          {truncateHash(e.original_hash)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-12 lg:pl-0">
                    <IntegrityBadge status={e.integrity_status} />
                    <StatusBadge status={e.status} />
                    <div className="text-right hidden lg:block">
                      <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-tight">{formatDate(e.created_at)}</p>
                    </div>
                    <Link to={`/evidence/${e.evidence_id}`}>
                      <Button variant="ghost" size="icon">
                        <Search className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
