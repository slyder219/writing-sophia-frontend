import { useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { authClient } from '../lib/auth'
import { setSignedInHint } from '../lib/signedInHint'
import AuthForm from './AuthForm'
import Dashboard from './Dashboard'
import './studio.css'

// Sign-in and the editor dashboard. Lazy-loaded so public visitors never
// download the auth SDK.
export default function Studio() {
  const session = authClient.useSession()
  const signedIn = Boolean(session.data)
  // Sent here to sign in from a piece: go back once signed in (same-site paths only)
  const next = useSearchParams()[0].get('next')
  const back = next?.startsWith('/') && !next.startsWith('//') ? next : null

  useEffect(() => {
    if (!session.isPending) setSignedInHint(signedIn)
  }, [session.isPending, signedIn])

  return (
    <div className="studio">
      <header className="studio-header">
        <Link to={back ?? '/'}>← Back to the writing</Link>
      </header>
      <main>
        {session.isPending ? null : session.data && back ? (
          <Navigate to={back} replace />
        ) : session.data ? (
          <Dashboard key={session.data.user.id} />
        ) : (
          <AuthForm />
        )}
      </main>
    </div>
  )
}
