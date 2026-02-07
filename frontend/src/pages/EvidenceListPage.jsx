import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getEvidenceList } from '../api/evidence'
import useAuth from '../hooks/useAuth'
import { hasPermission } from '../utils/roles'
import { formatDate, formatFileSize, truncateHash, formatCategoryLabel } from '../utils/formatters'
import IntegrityBadge from '../components/common/IntegrityBadge'
import StatusBadge from '../components/common/StatusBadge'
import Pagination from '../components/common/Pagination'

export default function EvidenceListPage() {
  const { user } = useAuth()
  const [evidence, setEvidence] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ category: '', status: '' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = { page, per_page: 10 }
        if (search) params.search = search
        if (filters.category) params.category = filters.category
        if (filters.status) params.status = filters.status
        const res = await getEvidenceList(params)
        setEvidence(res.data.evidence || [])
        setTotalPages(res.data.total_pages || 1)
      } catch {
        // Silent fail for list
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, search, filters])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Evidence</h1>
        {hasPermission(user?.role, 'upload') && (
          <Link to="/evidence/upload" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            Upload Evidence
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by file name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
        />
        <select
          value={filters.category}
          onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1) }}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All Categories</option>
          {['disk_image', 'document', 'image', 'video', 'audio', 'log', 'email', 'network_capture', 'other'].map(c => (
            <option key={c} value={c}>{formatCategoryLabel(c)}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="disposed">Disposed</option>
        </select>
      </div>

      {/* Evidence Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <p className="p-6 text-gray-500">Loading evidence...</p>
        ) : evidence.length === 0 ? (
          <p className="p-6 text-gray-500">No evidence found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">File Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hash</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Integrity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {evidence.map(e => (
                  <tr key={e.evidence_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/evidence/${e.evidence_id}`} className="text-blue-600 hover:underline text-sm font-medium">
                        {e.file_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatCategoryLabel(e.category)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(e.file_size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{truncateHash(e.original_hash)}</td>
                    <td className="px-4 py-3"><IntegrityBadge status={e.integrity_status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(e.created_at)}</td>
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
