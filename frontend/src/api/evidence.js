import client from './client'

export const uploadEvidence = (formData) =>
  client.post('/evidence/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getEvidenceList = (params) =>
  client.get('/evidence/', { params })

export const getEvidence = (evidenceId) =>
  client.get(`/evidence/${evidenceId}`)

export const updateEvidence = (evidenceId, data) =>
  client.patch(`/evidence/${evidenceId}`, data)

export const deleteEvidence = (evidenceId) =>
  client.delete(`/evidence/${evidenceId}`)

export const verifyEvidence = (evidenceId) =>
  client.post(`/evidence/${evidenceId}/verify`)

export const getEvidenceHistory = (evidenceId) =>
  client.get(`/evidence/${evidenceId}/history`)

export const downloadEvidence = (evidenceId) =>
  client.get(`/evidence/${evidenceId}/download`, { responseType: 'blob' })

export const previewEvidence = (evidenceId) =>
  client.get(`/evidence/${evidenceId}/preview`, { responseType: 'blob' })

export const getEvidenceTrustScore = (evidenceId) =>
  client.get(`/evidence/${evidenceId}/trust-score`)

export const getAnalytics = () =>
  client.get('/evidence/analytics')

export const checkRetention = () =>
  client.get('/evidence/retention/check')

export const disposeEvidence = (evidenceId, reason) =>
  client.post(`/evidence/${evidenceId}/dispose`, { reason })

export const bulkVerify = (evidenceIds) =>
  client.post('/evidence/bulk/verify', { evidence_ids: evidenceIds })

export const exportEvidenceCSV = (caseId) =>
  client.get('/evidence/export/evidence', { params: caseId ? { case_id: caseId } : {}, responseType: 'blob' })

export const exportAuditCSV = () =>
  client.get('/evidence/export/audit', { responseType: 'blob' })

export const exportCasesCSV = () =>
  client.get('/evidence/export/cases', { responseType: 'blob' })
