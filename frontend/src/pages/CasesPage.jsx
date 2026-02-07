import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCases, createCase } from '../api/cases'
import useAuth from '../hooks/useAuth'
import { hasPermission } from '../utils/roles'
import { formatDate } from '../utils/formatters'
import StatusBadge from '../components/common/StatusBadge'
import Pagination from '../components/common/Pagination'

export default function CasesPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [error, setError] = useState('')

  const loadCases = async () => {
    setLoading(true)
    try {
      const res = await getCases({ page, per_page: 10 })
      setCases(res.data.cases || [])
      setTotalPages(res.data.total_pages || 1)
    } catch {
      setError('Failed to load cases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCases() }, [page])

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
        {hasPermission(user?.role, 'upload') && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            {showForm ? 'Cancel' : 'New Case'}
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Case title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Case description"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            Create Case
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg border">
        {loading ? (
          <p className="p-6 text-gray-500">Loading cases...</p>
        ) : cases.length === 0 ? (
          <p className="p-6 text-gray-500">No cases found</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Case #</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cases.map(c => (
                <tr key={c.case_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/cases/${c.case_id}`} className="text-blue-600 hover:underline text-sm font-medium">
                      {c.case_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{c.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
