import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, {
  adapter: BetterAuthReactAdapter(),
})

// Neon Auth puts a short-lived JWT in session.token; the backend verifies it.
export async function getToken() {
  const { data } = await authClient.getSession()
  return data?.session?.token ?? null
}
