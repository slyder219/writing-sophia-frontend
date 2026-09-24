import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { authClient } from '../lib/auth'
import { setSignedInHint } from '../lib/signedInHint'

const EDITOR_LINKS = [
  { tab: 'upload', label: 'Upload' },
  { tab: 'manage', label: 'Manage' },
  { tab: 'categories', label: 'Categories' },
]

// Shown across public pages when signed in. Lazy-loaded (see Layout).
export default function EditorBar() {
  const session = authClient.useSession()
  const [me, setMe] = useState(null)
  const userId = session.data?.user.id

  useEffect(() => {
    if (session.isPending) return
    setSignedInHint(Boolean(userId))
    if (userId) api('/me').then(setMe).catch(() => setMe(null))
  }, [session.isPending, userId])

  if (!userId || !me) return null

  return (
    <nav className="editor-bar" aria-label="Editor">
      <span className="editor-bar-who">
        {me.name} · {me.role}
      </span>
      <span className="editor-bar-links">
        {me.is_editor &&
          EDITOR_LINKS.map((l) => (
            <Link key={l.tab} to={`/studio?tab=${l.tab}`}>
              {l.label}
            </Link>
          ))}
        <Link to="/studio?tab=account">Account</Link>
        <button onClick={() => authClient.signOut()}>Sign out</button>
      </span>
    </nav>
  )
}
