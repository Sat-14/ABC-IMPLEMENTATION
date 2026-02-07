import client from './client'

export const downloadEvidenceReport = (evidenceId) =>
  client.get(`/reports/evidence/${evidenceId}`, { responseType: 'blob' })

export const downloadCaseReport = (caseId) =>
  client.get(`/reports/case/${caseId}`, { responseType: 'blob' })
