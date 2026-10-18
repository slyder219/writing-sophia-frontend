import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { authClient } from '../lib/auth'
import { setSignedInHint } from '../lib/signedInHint'
import Discussion from './Discussion'

// The interactive discussion, lazy-loaded only for browsers that have signed
// in, so public readers never download the auth SDK. Every action returns the
// freshly published discussion, which replaces what's on screen.
export default function DiscussionLive({ slug, discussion, setDiscussion }) {
  const session = authClient.useSession()
  const userId = session.data?.user.id
  const [me, setMe] = useState(undefined)
  const [mine, setMine] = useState(undefined)

  useEffect(() => {
    if (session.isPending) return
    setSignedInHint(Boolean(userId))
    if (!userId) {
      setMe(null)
      return
    }
    let live = true
    Promise.all([api('/me'), api(`/works/${encodeURIComponent(slug)}/my-reactions`)])
      .then(([me, mine]) => {
        if (!live) return
        setMe(me)
        setMine(mine)
      })
      .catch(() => live && setMe(null))
    return () => {
      live = false
    }
  }, [session.isPending, userId, slug])

  if (!me) return <Discussion slug={slug} discussion={discussion} viewer={me} />

  const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) })
  const actions = {
    comment: async (body, parentId) =>
      setDiscussion(await post(`/works/${encodeURIComponent(slug)}/comments`, { body, parent_id: parentId })),
    react: async (reaction, commentId) => {
      const result = await post(`/works/${encodeURIComponent(slug)}/reactions`, { reaction, comment_id: commentId })
      setDiscussion(result.discussion)
      setMine(result.mine)
    },
    remove: async (id) => setDiscussion(await api(`/comments/${id}`, { method: 'DELETE' })),
    ban: async (id, deleteComments) =>
      setDiscussion(await post(`/comments/${id}/ban-author`, { delete_comments: deleteComments })),
  }

  return <Discussion slug={slug} discussion={discussion} viewer={me} mine={mine} actions={actions} />
}
