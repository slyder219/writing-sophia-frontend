import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useSignedInHint } from './lib/signedInHint'

const SiteBarLinks = lazy(() => import('./SiteBarLinks'))

// Always-present strip across the top of every page: the logo for everyone,
// plus the links their role allows for signed-in users.
export default function SiteBar() {
  const maybeSignedIn = useSignedInHint()
  return (
    <nav className="site-bar" aria-label="Account">
      <Link to="/" className="site-bar-logo" aria-label="Sophia Lyder — home">
        <img src="/favicon-96x96.png" alt="" width="30" height="30" />
      </Link>
      {maybeSignedIn && (
        <Suspense fallback={null}>
          <SiteBarLinks />
        </Suspense>
      )}
    </nav>
  )
}
