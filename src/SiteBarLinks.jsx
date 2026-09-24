import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from './lib/api'
import { authClient } from './lib/auth'
import { setSignedInHint } from './lib/signedInHint'

const EDITOR_LINKS = [
  { tab: 'upload', label: 'Upload' },
  { tab: 'manage', label: 'Manage' },
  { tab: 'categories', label: 'Categories' },
]

// Survives remounts so the links don't blink while /me is re-fetched
let cachedMe = null

export default function SiteBarLinks() {
  const session = authClient.useSession()
  const userId = session.data?.user.id
  const [me, setMe] = useState(cachedMe)

  useEffect(() => {
    if (session.isPending) return
    setSignedInHint(Boolean(userId))
    if (!userId) {
      cachedMe = null
      setMe(null)
      return
    }
    if (cachedMe?.id === userId) return
    api('/me')
      .then((data) => {
        cachedMe = data
        setMe(data)
      })
      .catch(() => setMe(null))
  }, [session.isPending, userId])

  const current = me && (session.isPending || me.id === userId) ? me : null
  if (!current) return null

  return (
    <>
      <span className="site-bar-who">
        {current.name} · {current.role}
      </span>
      <span className="site-bar-links">
        {current.is_editor &&
          EDITOR_LINKS.map((l) => (
            <Link key={l.tab} to={`/studio?tab=${l.tab}`}>
              {l.label}
            </Link>
          ))}
        <Link to="/studio?tab=account">Account</Link>
        <button onClick={() => authClient.signOut()}>Sign out</button>
      </span>
    </>
  )
}
