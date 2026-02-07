import client from './client'

export const globalSearch = (query, limit = 5) =>
    client.get('/search', { params: { q: query, limit } })
