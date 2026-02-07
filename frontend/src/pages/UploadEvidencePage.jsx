import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { uploadEvidence } from '../api/evidence'
import { getCases } from '../api/cases'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Input, Select } from '../components/common/Input'
import {
  CloudUpload,
  FileText,
  Briefcase,
  Tag,
  Shield,
  Info,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Loader2
} from 'lucide-react'

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
  const location = useLocation()
  const [file, setFile] = useState(null)
  const [cases, setCases] = useState([])
  const [form, setForm] = useState({
    case_id: location.state?.selectedCase?.case_id || '',
    category: 'document',
    classification: 'internal',
    description: '',
    tags: '',
  })
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    getCases({ per_page: 100 }).then(res => {
      setCases(res.data.cases || [])
    }).catch(() => { })
  }, [])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) setFile(selectedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) setFile(droppedFile)
  }

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
      <div className="max-w-2xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-500">
        <Card className="overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white/90 backdrop-blur-xl">
          <div className="h-2 bg-green-500 w-full" />
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-text-primary mb-2">Evidence Secured</h2>
            <p className="text-text-secondary text-lg mb-8">Metadata hashed and stored in custody.</p>

            <div className="bg-bg-secondary/50 rounded-2xl p-6 mb-8 border border-border-subtle text-left space-y-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Evidence ID</span>
                <span className="text-sm font-mono text-text-primary break-all bg-white/50 p-2 rounded border border-border-subtle">{result.evidence.evidence_id}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Cryptographic Hash (SHA-256)</span>
                <span className="text-sm font-mono text-text-primary break-all bg-white/50 p-2 rounded border border-border-subtle">{result.evidence.original_hash}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">File Name</span>
                <span className="text-sm font-semibold text-text-primary px-2">{result.evidence.file_name}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate(`/evidence/${result.evidence.evidence_id}`)}
                className="flex-1 h-12 rounded-xl text-md font-bold shadow-lg shadow-primary-500/20"
              >
                View Documentation
              </Button>
              <Button
                variant="outline"
                onClick={() => { setResult(null); setFile(null) }}
                className="flex-1 h-12 rounded-xl text-md font-bold"
              >
                Upload Detailed Item
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden">
      {/* HEADER SECTION - TOP LEFT ALIGNMENT */}
      <div className="pt-4 ml-6 mb-4 animate-in fade-in slide-in-from-left duration-700 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#334155]" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-[#0F172A] leading-tight tracking-tight">Upload Evidence</h1>
            <p className="text-[14px] text-[#64748B] mt-0.5">Initialize digital artifact custody</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2 duration-300 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{error}</div>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN CONTENT CARD - FULL WIDTH */}
      <div className="flex-1 mx-6 mb-6 overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-5 flex-1 flex flex-col justify-between overflow-y-auto min-h-0">
            {/* EVIDENCE SOURCE SECTION */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.05em]">
                <CloudUpload className="w-4 h-4" />
                Evidence Source
              </label>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl min-h-[180px] flex items-center justify-center transition-all duration-300
                  ${isDragging ? 'border-blue-400 bg-blue-50/50 scale-[1.005]' : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-blue-300 hover:bg-slate-100/50'}
                  ${file ? 'border-green-300 bg-green-50/5' : ''}
                `}
              >
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer text-center group w-full py-4">
                  {!file ? (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                        <CloudUpload className="w-8 h-8 text-[#3B82F6]" />
                      </div>
                      <h3 className="text-base font-semibold text-[#1E293B]">Drop artifacts here to begin hash</h3>
                      <p className="text-[12px] text-[#94A3B8] mt-1">Industry standard forensic formats supported</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-3 border border-green-100 shadow-inner">
                        <FileText className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="text-base font-semibold text-[#1E293B]">{file.name}</h3>
                      <p className="text-[11px] text-green-600/70 font-bold uppercase tracking-widest mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • READY
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setFile(null); }}
                        className="mt-3 text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded border border-red-100 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-4">
              {/* FORM GRID - THREE COLUMNS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Investigation Context */}
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[#475569] ml-0.5">Investigation Context</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                    <select
                      value={form.case_id}
                      onChange={(e) => setForm({ ...form, case_id: e.target.value })}
                      required
                      className="w-full h-10 pl-9 pr-9 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#334155] font-normal outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 hover:border-[#93C5FD] appearance-none"
                    >
                      <option value="" className="text-[#94A3B8]">Select a case...</option>
                      {cases.map(c => (
                        <option key={c.case_id} value={c.case_id}>{c.case_number} - {c.title}</option>
                      ))}
                    </select>
                    <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>

                {/* Artifact Category */}
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[#475569] ml-0.5">Artifact Category</label>
                  <div className="relative group">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full h-10 pl-9 pr-9 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#334155] font-normal outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 hover:border-[#93C5FD] appearance-none"
                    >
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>

                {/* Security Clearance */}
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[#475569] ml-0.5">Security Clearance</label>
                  <div className="relative group">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                    <select
                      value={form.classification}
                      onChange={(e) => setForm({ ...form, classification: e.target.value })}
                      className="w-full h-10 pl-9 pr-9 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#334155] font-normal outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 hover:border-[#93C5FD] appearance-none"
                    >
                      {CLASSIFICATIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 2: Contextual Description & Tags */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[12px] font-medium text-[#475569] ml-0.5">Contextual Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full min-h-[80px] p-3 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#334155] font-normal outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 hover:border-[#93C5FD] placeholder:text-[#94A3B8]"
                    placeholder="Log entries..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-[#475569] ml-0.5">Taxonomy Tags</label>
                    <div className="relative group">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                      <input
                        type="text"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        placeholder="malware, encryption"
                        className="w-full h-10 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-[#334155] font-normal outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 hover:border-[#93C5FD] placeholder:text-[#94A3B8]"
                      />
                    </div>
                  </div>

                  {/* CHAIN OF CUSTODY GUARANTEE BOX */}
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] border-l-4 border-l-[#3B82F6] rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-[#3B82F6] mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-[13px] font-bold text-[#1E293B]">Chain of Custody Guarantee</h4>
                        <p className="text-[11px] text-[#475569] leading-tight mt-0.5">SHA-256 hashed and timestamped instantly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FINALIZE BUTTON */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full h-[44px] mt-4 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-lg text-[14px] font-semibold tracking-wide shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Finalize Evidence Custody
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
