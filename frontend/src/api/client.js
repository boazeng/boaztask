import axios from 'axios'

// Single shared axios instance so a single response interceptor catches
// 401s from every endpoint (tasks, subjects, auth tokens, …).
export const apiClient = axios.create({ baseURL: '/api' })

export const installAuthInterceptor = (onUnauthorized) => {
  apiClient.interceptors.response.use(
    (r) => r,
    (error) => {
      if (error?.response?.status === 401) onUnauthorized?.(error)
      return Promise.reject(error)
    }
  )
}
