import { lazy, Suspense } from 'react'
import { useSignedInHint } from './lib/signedInHint'

const SiteBarLinks = lazy(() => import('./SiteBarLinks'))

// Always-present strip across the top of every page. It stays empty for
// visitors; signed-in users get the links their role allows.
export default function SiteBar() {
  const maybeSignedIn = useSignedInHint()
  return (
    <nav className="site-bar" aria-label="Account">
      {maybeSignedIn && (
        <Suspense fallback={null}>
          <SiteBarLinks />
        </Suspense>
      )}
    </nav>
  )
}
