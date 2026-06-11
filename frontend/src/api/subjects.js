import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getSubjects = () => api.get('/subjects/').then(r => r.data)
export const createSubject = (name) => api.post('/subjects/', { name }).then(r => r.data)
export const updateSubject = (id, name) => api.patch(`/subjects/${id}`, { name }).then(r => r.data)
export const deleteSubject = (id) => api.delete(`/subjects/${id}`)

export const createSubSubject = (subjectId, name) =>
  api.post(`/subjects/${subjectId}/sub-subjects`, { name }).then(r => r.data)
export const updateSubSubject = (id, name) =>
  api.patch(`/subjects/sub-subjects/${id}`, { name }).then(r => r.data)
export const deleteSubSubject = (id) =>
  api.delete(`/subjects/sub-subjects/${id}`)

export const reorderSubjects = (ids) =>
  api.post('/subjects/reorder', { ids })
export const reorderSubSubjects = (subjectId, ids) =>
  api.post(`/subjects/${subjectId}/sub-subjects/reorder`, { ids })
