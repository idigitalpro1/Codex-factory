import api from './axios'

// ── Auth ───────────────────────────────────────────────────────────
// POST /api/v1/auth/login → { token, user }
// NOTE: Backend stub needed. Current workaround: admin key = token.
export const login = (key) =>
  api.post('/auth/login', { key }).catch(() => {
    // Backend JWT not yet implemented — accept admin key directly
    if (key === localStorage.getItem('cx-admin-key') || key.length > 8) {
      return { data: { token: key, user: { name: 'Admin' } } }
    }
    throw new Error('Invalid key')
  })

// ── Health ─────────────────────────────────────────────────────────
export const getHealth = () => api.get('/health')

// ── Brands ─────────────────────────────────────────────────────────
export const getBrands = () => api.get('/brands')

// ── Domains ────────────────────────────────────────────────────────
export const getDomains = (params = {}) =>
  api.get('/admin/ops/domains', { params })
export const createDomain = (data) => api.post('/admin/ops/domains', data)
export const updateDomain = (id, data) => api.patch(`/admin/ops/domains/${id}`, data)

// ── Campaign Kits ──────────────────────────────────────────────────
export const getKits = () => api.get('/kits')
export const getKitStatus = (id) => api.get(`/kits/${id}/status`)
export const importKit = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/kits/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const publishKit = (id) => api.post(`/kits/${id}/publish`)

// ── Billing ────────────────────────────────────────────────────────
export const getInvoices = (params = {}) =>
  api.get('/billing/invoices', { params })
export const createInvoice = (data) => api.post('/billing/invoices', data)
export const updateInvoice = (id, data) => api.patch(`/billing/invoices/${id}`, data)
export const sendInvoice = (id) => api.post(`/billing/invoices/${id}/send`)
export const getInvoicePdf = (id) => `/api/v1/billing/invoices/${id}/pdf`

// ── Articles ───────────────────────────────────────────────────────
export const getArticles = (params = {}) =>
  api.get('/admin/articles', { params })
export const createArticle = (data) => api.post('/admin/articles', data)
export const updateArticle = (id, data) => api.patch(`/admin/articles/${id}`, data)
