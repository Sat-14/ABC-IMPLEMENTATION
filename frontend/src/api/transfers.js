import client from './client'

export const requestTransfer = (data) =>
  client.post('/transfers/', data)

export const getTransfers = (params) =>
  client.get('/transfers/', { params })

export const getTransfer = (transferId) =>
  client.get(`/transfers/${transferId}`)

export const approveTransfer = (transferId) =>
  client.patch(`/transfers/${transferId}/approve`)

export const rejectTransfer = (transferId) =>
  client.patch(`/transfers/${transferId}/reject`)

export const completeTransfer = (transferId) =>
  client.patch(`/transfers/${transferId}/complete`)

export const cancelTransfer = (transferId) =>
  client.patch(`/transfers/${transferId}/cancel`)
