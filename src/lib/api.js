import { getToken } from './auth'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export async function api(path, options = {}) {
  const token = await getToken()
  const isJson = options.body && !(options.body instanceof FormData)
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...(isJson ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`)
  return data
}
