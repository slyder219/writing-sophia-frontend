import { useState } from 'react'
import { Link } from 'react-router-dom'

// Must match REACTIONS in the backend (and the CHECK in its migration)
export const REACTIONS = [
  { key: 'heart', emoji: '❤️', label: 'Love' },
  { key: 'clap', emoji: '👏', label: 'Applause' },
  { key: 'laugh', emoji: '😂', label: 'Funny' },
  { key: 'cry', emoji: '😢', label: 'Moving' },
  { key: 'sparkles', emoji: '✨', label: 'Beautiful' },
]

const MAX_CHARS = 2000
const NO_MINE = { work: [], comments: {} }

// Reactions on the piece and its comments, two levels deep: replies to replies
// sit under the same top comment with "replying to @name".
//   viewer: undefined while unknown, null when signed out, otherwise /me
//   actions: null unless signed in — { comment, react, remove, ban }
export default function Discussion({ slug, discussion, viewer, mine = NO_MINE, actions = null }) {
  const [replyTo, setReplyTo] = useState(null) // comment id
  const signIn = `/studio?next=${encodeURIComponent(`/w/${slug}`)}`
  const { comments } = discussion

  const byId = new Map(comments.map((c) => [c.id, c]))
  const rootOf = (c) => {
    while (c.parent_id != null && byId.has(c.parent_id)) c = byId.get(c.parent_id)
    return c
  }
  const tops = []
  const replies = new Map()
  for (const c of comments) {
    const root = rootOf(c)
    if (root === c) tops.push(c)
    else replies.set(root.id, [...(replies.get(root.id) ?? []), c])
  }
  const live = comments.filter((c) => !c.deleted).length

  const shared = { viewer, mine, actions, signIn, replyTo, setReplyTo }

  return (
    <section className="discussion" aria-label="Reactions and comments">
      <ReactionBar
        counts={discussion.reactions}
        mine={mine.work}
        onReact={actions && ((reaction) => actions.react(reaction, null))}
        signIn={signIn}
      />

      <h2 className="discussion-title">
        {live ? `${live} comment${live === 1 ? '' : 's'}` : 'Comments'}
      </h2>

      {viewer === null && (
        <p className="discussion-prompt">
          <Link to={signIn}>Sign in or sign up</Link> to comment and react.
        </p>
      )}
      {viewer && !viewer.username && (
        <p className="discussion-prompt">
          <Link to="/studio?tab=account">Choose a username</Link> to comment.
        </p>
      )}
      {viewer?.username && actions && (
        <CommentForm placeholder="Leave a comment…" onSubmit={(body) => actions.comment(body, null)} />
      )}

      {tops.length === 0 ? (
        <p className="quiet">No comments yet.</p>
      ) : (
        <ol className="comments">
          {tops.map((c) => (
            <li key={c.id}>
              <Comment comment={c} {...shared} />
              {replies.has(c.id) && (
                <ol className="replies">
                  {replies.get(c.id).map((r) => (
                    <li key={r.id}>
                      <Comment comment={r} parent={r.parent_id !== c.id ? byId.get(r.parent_id) : null} {...shared} />
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function Comment({ comment: c, parent, viewer, mine, actions, signIn, replyTo, setReplyTo }) {
  if (c.deleted) return <p className="comment comment-deleted">[deleted]</p>

  const own = viewer?.username && c.author === viewer.username
  const canDelete = actions && (own || viewer.is_editor)
  const canBan = actions && viewer.is_editor && !own && !c.is_author && c.author

  async function remove() {
    if (!confirm('Delete this comment?')) return
    await actions.remove(c.id).catch((err) => alert(err.message))
  }

  async function ban() {
    if (!confirm(`Ban @${c.author}? They’ll be signed out and can’t sign in again.`)) return
    const purge = confirm(`Also delete all of @${c.author}’s comments and reactions across the site?`)
    await actions.ban(c.id, purge).catch((err) => alert(err.message))
  }

  return (
    <article className="comment">
      <header className="comment-meta">
        <span className="comment-author">{c.author ? `@${c.author}` : '[deleted]'}</span>
        {c.is_author && <span className="author-badge">author</span>}
        <time dateTime={c.created_at}>{new Date(c.created_at).toLocaleDateString()}</time>
      </header>
      {parent && (
        <p className="comment-replying">
          ↪ replying to {parent.author && !parent.deleted ? `@${parent.author}` : '[deleted]'}
        </p>
      )}
      <p className="comment-body">{c.body}</p>
      <div className="comment-actions">
        <ReactionBar
          compact
          counts={c.reactions}
          mine={mine.comments[c.id] ?? []}
          onReact={actions && ((reaction) => actions.react(reaction, c.id))}
          signIn={signIn}
        />
        {actions && viewer.username && (
          <button className="text-button" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
            Reply
          </button>
        )}
        {canDelete && (
          <button className="text-button" onClick={remove}>
            Delete
          </button>
        )}
        {canBan && (
          <button className="text-button" onClick={ban}>
            Ban
          </button>
        )}
      </div>
      {replyTo === c.id && (
        <CommentForm
          autoFocus
          placeholder={`Reply to @${c.author}…`}
          onSubmit={async (body) => {
            await actions.comment(body, c.id)
            setReplyTo(null)
          }}
          onCancel={() => setReplyTo(null)}
        />
      )}
    </article>
  )
}

function CommentForm({ placeholder, onSubmit, onCancel, autoFocus }) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit(body)
      setBody('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="comment-form" onSubmit={submit}>
      <textarea
        rows={3}
        placeholder={placeholder}
        aria-label={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_CHARS}
        autoFocus={autoFocus}
        required
      />
      <div className="comment-form-row">
        {body.length > MAX_CHARS * 0.9 && (
          <span className="char-count">
            {body.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        )}
        {error && (
          <span className="comment-error" role="alert">
            {error}
          </span>
        )}
        {onCancel && (
          <button type="button" className="text-button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={busy || !body.trim()}>
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  )
}

// Full row on the piece; on comments only the reactions it has, plus a picker
function ReactionBar({ counts, mine, onReact, signIn, compact = false }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const shown = compact && !open ? REACTIONS.filter((r) => counts[r.key]) : REACTIONS

  async function react(key) {
    setBusy(true)
    try {
      await onReact(key)
      setOpen(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (compact && !onReact && shown.length === 0) return null

  return (
    <div className={`reactions${compact ? ' reactions-compact' : ''}`}>
      {shown.map((r) => {
        const count = counts[r.key] || 0
        const label = `${r.label}${count ? ` (${count})` : ''}`
        const content = (
          <>
            <span aria-hidden="true">{r.emoji}</span>
            {count > 0 && <span className="reaction-count">{count}</span>}
          </>
        )
        if (onReact)
          return (
            <button
              key={r.key}
              className={`reaction${mine.includes(r.key) ? ' mine' : ''}`}
              aria-pressed={mine.includes(r.key)}
              aria-label={label}
              title={r.label}
              disabled={busy}
              onClick={() => react(r.key)}
            >
              {content}
            </button>
          )
        if (compact)
          return (
            <span key={r.key} className="reaction" aria-label={label} title={r.label}>
              {content}
            </span>
          )
        return (
          <Link key={r.key} to={signIn} className="reaction" aria-label={`${label} — sign in to react`} title={r.label}>
            {content}
          </Link>
        )
      })}
      {compact && onReact && (
        <button
          className="reaction reaction-add"
          aria-label={open ? 'Hide reactions' : 'Add a reaction'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? '×' : '☺︎+'}
        </button>
      )}
    </div>
  )
}
