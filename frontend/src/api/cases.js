import client from './client'

export const createCase = (data) =>
  client.post('/cases/', data)

export const getCases = (params) =>
  client.get('/cases/', { params })

export const getCase = (caseId) =>
  client.get(`/cases/${caseId}`)

export const updateCase = (caseId, data) =>
  client.patch(`/cases/${caseId}`, data)

export const getCaseEvidence = (caseId) =>
  client.get(`/cases/${caseId}/evidence`)

export const getCaseTimeline = (caseId) =>
  client.get(`/cases/${caseId}/timeline`)
