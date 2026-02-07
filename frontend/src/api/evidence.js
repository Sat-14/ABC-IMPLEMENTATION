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
