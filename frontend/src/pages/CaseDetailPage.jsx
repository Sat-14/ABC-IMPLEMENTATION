import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCase, getCaseEvidence } from '../api/cases'
import { formatDate, formatFileSize } from '../utils/formatters'
import StatusBadge from '../components/common/StatusBadge'
import IntegrityBadge from '../components/common/IntegrityBadge'

export default function CaseDetailPage() {
  const { id } = useParams()
  const [caseData, setCaseData] = useState(null)
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [caseRes, evidenceRes] = await Promise.all([
          getCase(id),
          getCaseEvidence(id),
        ])
        setCaseData(caseRes.data.case)
        setEvidence(evidenceRes.data.evidence || [])
      } catch {
        setError('Failed to load case details')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (error) return <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md">{error}</div>
  if (!caseData) return <p className="text-gray-500">Case not found</p>

  return (
    <div>
      <div className="mb-6">
        <Link to="/cases" className="text-sm text-blue-600 hover:underline">&larr; Back to Cases</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{caseData.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-gray-500">{caseData.case_number}</span>
          <StatusBadge status={caseData.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Case Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900 mt-1">{caseData.description || 'No description'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900 mt-1">{formatDate(caseData.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Evidence Count</dt>
                <dd className="text-sm text-gray-900 mt-1">{evidence.length}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Linked Evidence */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Linked Evidence</h2>
            </div>
            {evidence.length === 0 ? (
              <p className="p-6 text-gray-500">No evidence linked to this case</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">File Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Integrity</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {evidence.map(e => (
                    <tr key={e.evidence_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link to={`/evidence/${e.evidence_id}`} className="text-blue-600 hover:underline text-sm">
                          {e.file_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(e.file_size)}</td>
                      <td className="px-4 py-3"><IntegrityBadge status={e.integrity_status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
