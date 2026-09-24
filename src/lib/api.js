import { getToken } from './auth'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export async function api(path, options = {}) {
  const token = await getToken()
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`)
  return data
}
