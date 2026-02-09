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

export const transcribeEvidence = (evidenceId) =>
  client.post(`/evidence/${evidenceId}/transcribe`)

// Share link functions
export const createShareLink = (evidenceId, expiresInHours, recipientEmail) =>
  client.post(`/evidence/${evidenceId}/share`, {
    expires_in_hours: expiresInHours,
    recipient_email: recipientEmail
  })

export const getShareTokens = (evidenceId) =>
  client.get(`/evidence/${evidenceId}/shares`)

export const revokeShareToken = (tokenId) =>
  client.delete(`/evidence/shares/${tokenId}`)

export const getSharedEvidence = (token) =>
  client.get(`/evidence/public/shared/${token}`)

export const linkEvidenceToCase = (evidenceId, caseId) =>
  client.post(`/evidence/${evidenceId}/link/${caseId}`)

export const unlinkEvidenceFromCase = (evidenceId, caseId) =>
  client.delete(`/evidence/${evidenceId}/unlink/${caseId}`)

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
