import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach auth token ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cx-token')
    if (token) {
      // Bearer JWT (future) + X-Admin-Key (current backend compatibility)
      config.headers['Authorization'] = `Bearer ${token}`
      config.headers['X-Admin-Key'] = token
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor: handle 401 → redirect to login ──────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cx-token')
      localStorage.removeItem('cx-user')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  },
)

export default api
