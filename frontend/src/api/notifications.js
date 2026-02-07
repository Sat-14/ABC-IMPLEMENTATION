import client from './client'

export const getNotifications = (params) =>
  client.get('/notifications/', { params })

export const getUnreadCount = () =>
  client.get('/notifications/unread-count')

export const markAsRead = (notificationId) =>
  client.patch(`/notifications/${notificationId}/read`)

export const markAllAsRead = () =>
  client.patch('/notifications/read-all')
