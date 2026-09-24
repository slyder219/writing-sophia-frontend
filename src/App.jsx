import { useEffect, useState } from 'react'
import Account from './components/Account'
import AuthForm from './components/AuthForm'
import { authClient } from './lib/auth'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const STATUS_TEXT = {
  checking: 'Checking backend connection…',
  connected: '✓ Connected to backend',
  failed: '✗ Could not reach backend',
}

export default function App() {
  const [status, setStatus] = useState('checking')
  const session = authClient.useSession()

  useEffect(() => {
    fetch(`${BACKEND_URL}/health`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => setStatus(data.status === 'ok' ? 'connected' : 'failed'))
      .catch(() => setStatus('failed'))
  }, [])

  return (
    <main>
      <h1>Writing Sophia</h1>
      <p>Coming soon.</p>
      <p className={`status status-${status}`}>{STATUS_TEXT[status]}</p>

      {session.isPending ? null : session.data ? (
        <Account key={session.data.user.id} />
      ) : (
        <AuthForm />
      )}
    </main>
  )
}
