import client from './client'

export const getAuditLogs = (params) =>
  client.get('/audit/', { params })

export const getEvidenceAuditLogs = (evidenceId) =>
  client.get(`/audit/evidence/${evidenceId}`)

export const verifyAuditChain = () =>
  client.get('/audit/verify-chain')

export const getEvidenceAuditSummary = (evidenceId) =>
  client.get(`/audit/summary/evidence/${evidenceId}`)
