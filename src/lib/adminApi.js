import { API_BASE } from './apiBase'

/**
 * Every admin request goes through here. Session auth relies on the
 * browser sending the PHP session cookie, hence `credentials: 'include'`
 * on every call — this only works because the backend's CORS config
 * echoes back a specific allowed origin (never '*') with
 * Access-Control-Allow-Credentials: true. See vyro-backend/config/config.php.
 */
async function request(path, options = {}) {
  let csrfToken = null
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes((options.method || 'GET').toUpperCase())) {
    const csrfResponse = await fetch(`${API_BASE}/api/auth/csrf.php`, { credentials: 'include' })
    const csrfBody = await csrfResponse.json().catch(() => null)
    if (!csrfResponse.ok || !csrfBody?.success || !csrfBody?.data?.csrfToken) {
      throw new ApiError('Could not establish a secure session. Refresh and try again.', csrfResponse.status)
    }
    csrfToken = csrfBody.data.csrfToken
  }
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}), ...options.headers },
      ...options,
    })
  } catch {
    throw new ApiError('Could not reach the server. Is the backend running?', 0)
  }

  const body = await response.json().catch(() => null)

  if (!response.ok || !body?.success) {
    throw new ApiError(body?.error ?? 'Something went wrong. Please try again.', response.status, body?.details)
  }

  return body.data
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.status = status
    this.details = details ?? null
  }
}

const post = (path, payload) => request(path, { method: 'POST', body: JSON.stringify(payload) })

export const adminApi = {
  // Auth (shared endpoints — admin-ness is checked server-side per request)
  login: (email, password) => post('/api/auth/login.php', { email, password }),
  logout: () => post('/api/auth/logout.php', {}),
  me: () => request('/api/auth/me.php'),

  // Dashboard
  dashboard: () => request('/api/admin/dashboard.php'),

  // Products
  products: () => request('/api/admin/products-list.php'),
  createProduct: (data) => post('/api/admin/products-create.php', data),
  updateProduct: (data) => post('/api/admin/products-update.php', data),
  deleteProduct: (id) => post('/api/admin/products-delete.php', { id }),
  uploadProductImage: (imageDataUrl) => post('/api/admin/products-upload-image.php', { imageDataUrl }),

  // Categories
  categories: () => request('/api/categories/list.php'),
  createCategory: (name) => post('/api/admin/categories-create.php', { name }),
  deleteCategory: (id) => post('/api/admin/categories-delete.php', { id }),

  // Orders
  orders: () => request('/api/admin/orders-list.php'),
  updateOrderStatus: (id, status) => post('/api/admin/orders-update-status.php', { id, status }),

  // Customers & inventory
  customers: () => request('/api/admin/customers-list.php'),
  inventory: () => request('/api/admin/inventory-list.php'),

  // VYRO Fit statistics
  tryOnStats: () => request('/api/admin/tryon-stats.php'),
}

/**
 * Fire-and-forget: called from the live VYRO Fit flow (not the admin
 * panel) every time a preview is actually generated. Never throws and
 * never blocks the UI — if the backend is unreachable, VYRO Fit still
 * works exactly as before, it just doesn't get counted.
 */
export async function logTryOnEvent(productIds) {
  try {
    const csrfResponse = await fetch(`${API_BASE}/api/auth/csrf.php`, { credentials: 'include' })
    const csrfBody = await csrfResponse.json()
    if (!csrfResponse.ok || !csrfBody?.success) return
    await fetch(`${API_BASE}/api/tryon-events/log.php`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfBody.data.csrfToken },
      body: JSON.stringify({ productIds }),
    })
  } catch { /* best effort: analytics must not block VYRO Fit */ }
}
