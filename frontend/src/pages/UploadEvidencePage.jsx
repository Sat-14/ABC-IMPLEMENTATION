import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadEvidence } from '../api/evidence'
import { getCases } from '../api/cases'

const CATEGORIES = [
  { value: 'disk_image', label: 'Disk Image' },
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'log', label: 'Log File' },
  { value: 'email', label: 'Email' },
  { value: 'network_capture', label: 'Network Capture' },
  { value: 'other', label: 'Other' },
]

const CLASSIFICATIONS = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Internal' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'restricted', label: 'Restricted' },
]

export default function UploadEvidencePage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [cases, setCases] = useState([])
  const [form, setForm] = useState({
    case_id: '',
    category: 'document',
    classification: 'internal',
    description: '',
    tags: '',
  })
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    getCases({ page: 1, per_page: 100 }).then(res => {
      setCases(res.data.cases || [])
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }
    if (!form.case_id) { setError('Please select a case'); return }

    setError('')
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('case_id', form.case_id)
    formData.append('category', form.category)
    formData.append('classification', form.classification)
    formData.append('description', form.description)
    formData.append('tags', form.tags)

    try {
      const res = await uploadEvidence(formData)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-800 mb-4">Evidence Uploaded Successfully</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-green-700">Evidence ID</dt>
              <dd className="text-sm font-mono">{result.evidence.evidence_id}</dd>
            </div>
            <div>
              <dt className="text-sm text-green-700">SHA-256 Hash</dt>
              <dd className="text-sm font-mono break-all">{result.evidence.original_hash}</dd>
            </div>
            <div>
              <dt className="text-sm text-green-700">File Name</dt>
              <dd className="text-sm">{result.evidence.file_name}</dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-3">
            <button onClick={() => navigate(`/evidence/${result.evidence.evidence_id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              View Evidence
            </button>
            <button onClick={() => { setResult(null); setFile(null) }}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm">
              Upload Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Evidence</h1>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evidence File</label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input type="file" onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {file && <p className="mt-2 text-sm text-gray-600">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>
        </div>

        {/* Case Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Case</label>
          <select value={form.case_id}
            onChange={(e) => setForm({ ...form, case_id: e.target.value })}
            required className="w-full px-3 py-2 border rounded-md text-sm">
            <option value="">Select a case...</option>
            {cases.map(c => (
              <option key={c.case_id} value={c.case_id}>{c.case_number} - {c.title}</option>
            ))}
          </select>
        </div>

        {/* Category & Classification */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
            <select value={form.classification}
              onChange={(e) => setForm({ ...form, classification: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm">
              {CLASSIFICATIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3} className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="Describe the evidence..." />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
          <input type="text" value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="e.g. malware, ransomware, laptop" />
        </div>

        <button type="submit" disabled={uploading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium">
          {uploading ? 'Uploading & Hashing...' : 'Upload Evidence'}
        </button>
      </form>
    </div>
  )
}
