const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || '').trim()
const pageOrigin = window.location.origin

function isLoopback(hostname) {
  const host = String(hostname || '').toLowerCase()
  return host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1' || host === '[::1]'
}

function resolveApiBase() {
  if (!configuredApiBase) return pageOrigin

  try {
    const configuredUrl = new URL(configuredApiBase, pageOrigin)
    // A localhost API is useful during local development, but on a public
    // deployment it points at each visitor's own computer. Use the same-origin
    // Worker API there instead.
    if (isLoopback(configuredUrl.hostname) && !isLoopback(window.location.hostname)) {
      return pageOrigin
    }
    return configuredUrl.origin
  } catch {
    return pageOrigin
  }
}

export const API_BASE = resolveApiBase().replace(/\/+$/, '')
