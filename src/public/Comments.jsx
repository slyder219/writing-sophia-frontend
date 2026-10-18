import { lazy, Suspense, useEffect, useState } from 'react'
import { useSignedInHint } from '../lib/signedInHint'
import { loadDiscussion } from '../lib/works'
import Discussion from './Discussion'

const DiscussionLive = lazy(() => import('./DiscussionLive'))

// Reactions and comments under a piece, read straight from the bucket
export default function Comments({ slug }) {
  const maybeSignedIn = useSignedInHint()
  const [discussion, setDiscussion] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    loadDiscussion(slug)
      .then((d) => live && setDiscussion(d))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [slug])

  if (failed) return <p className="quiet">Couldn’t load the comments.</p>
  if (!discussion) return null

  // Signed-out readers see the sign-in prompt; possibly-signed-in ones see
  // nothing extra until the session is known
  const fallback = <Discussion slug={slug} discussion={discussion} viewer={maybeSignedIn ? undefined : null} />
  if (!maybeSignedIn) return fallback
  return (
    <Suspense fallback={fallback}>
      <DiscussionLive slug={slug} discussion={discussion} setDiscussion={setDiscussion} />
    </Suspense>
  )
}
