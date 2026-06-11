import axios from 'axios'
import { apiClient as api } from './client'

// Non-/api endpoints from shared-auth (login/me/users) live at site root.
const root = axios.create({ baseURL: '/' })

export const getMe = () => root.get('auth/me').then(r => r.data)

export const listUsers = () => root.get('auth/users').then(r => r.data)
export const saveUser = (payload) => root.post('auth/users', payload).then(r => r.data)
export const deleteUser = (email) => root.post('auth/users/delete', { email }).then(r => r.data)

export const listTokens = () => api.get('/auth/tokens/').then(r => r.data)
export const createToken = (payload) => api.post('/auth/tokens/', payload).then(r => r.data)
export const revokeToken = (id) => api.delete(`/auth/tokens/${id}`)
