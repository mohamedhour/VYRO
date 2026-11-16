export type CustomerProfile = {
  fullName: string
  email: string
  discountPercent: number
  discountedOrdersRemaining: number
}

export type CustomerSession = {
  token: string
  profile: CustomerProfile
}

const SESSION_KEY = 'vyro-customer-session'

async function apiRequest<T>(path: string, body?: unknown, token?: string): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const result = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(result.error || 'Account service is unavailable right now.')
  return result
}

export function readCustomerSession(): CustomerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.token && parsed?.profile ? parsed : null
  } catch {
    return null
  }
}

export function saveCustomerSession(session: CustomerSession | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // The current page can still use the session in memory.
  }
}

export function registerCustomer(input: { fullName: string; email: string; password: string }) {
  return apiRequest<CustomerSession>('/api/auth/register', input)
}

export function loginCustomer(input: { email: string; password: string }) {
  return apiRequest<CustomerSession>('/api/auth/login', input)
}

export async function refreshCustomerSession(session: CustomerSession) {
  const response = await apiRequest<{ profile: CustomerProfile }>('/api/auth/me', undefined, session.token)
  return { ...session, profile: response.profile }
}

export function logoutCustomer(session: CustomerSession) {
  return apiRequest<{ success: boolean }>('/api/auth/logout', {}, session.token)
}

export function confirmAccountOrder(input: {
  subtotalMad: number
  deliveryFeeMad: number
  fullName: string
  email?: string
  phone: string
  city: string
  address: string
  promoCode?: string
  promoCustomerId?: string
  items: Array<{ productId: string; size: string; colorName: string; quantity: number }>
}, token?: string) {
  return apiRequest<{
    orderNumber: string
    subtotalMad: number
    discountMad: number
    promoDiscountMad: number
    totalMad: number
    profile: CustomerProfile | null
  }>('/api/orders/confirm', input, token)
}
