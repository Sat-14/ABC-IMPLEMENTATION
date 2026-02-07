import client from './client'

export const login = (email, password) =>
  client.post('/auth/login', { email, password })

export const register = (data) =>
  client.post('/auth/register', data)

export const getMe = () =>
  client.get('/auth/me')

export const refreshToken = (refresh_token) =>
  client.post('/auth/refresh', {}, {
    headers: { Authorization: `Bearer ${refresh_token}` }
  })

export const getUsers = () =>
  client.get('/auth/users')

export const updateUser = (userId, data) =>
  client.patch(`/auth/users/${userId}`, data)
