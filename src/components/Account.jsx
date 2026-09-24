import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { authClient } from '../lib/auth'

export default function Account() {
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api('/me').then(setMe).catch((err) => setError(err.message))
  }, [])

  return (
    <div className="account">
      {me && (
        <p>
          Signed in as {me.name} ({me.email}) · role: {me.role}
        </p>
      )}
      {error && <p className="error">{error}</p>}
      <button onClick={() => authClient.signOut()}>Sign out</button>
    </div>
  )
}
