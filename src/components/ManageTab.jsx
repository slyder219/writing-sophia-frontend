import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import UploadForm from './UploadForm'

export default function ManageTab() {
  const [works, setWorks] = useState(null)
  const [error, setError] = useState(null)
  const [replacing, setReplacing] = useState(null) // { slug, text }
  const [busySlug, setBusySlug] = useState(null)

  useEffect(() => {
    api('/works')
      .then(setWorks)
      .catch((err) => setError(err.message))
  }, [])

  async function startReplace(work) {
    setBusySlug(work.slug)
    setError(null)
    try {
      const { text } = await api(`/works/${work.slug}/text`)
      setReplacing({ slug: work.slug, text })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusySlug(null)
    }
  }

  async function replace(work, body) {
    const updated = await api(`/works/${work.slug}`, { method: 'PUT', body: JSON.stringify(body) })
    setWorks((list) => list.map((w) => (w.slug === updated.slug ? updated : w)))
    setReplacing(null)
  }

  async function remove(work) {
    if (!confirm(`Delete “${work.title}”? This can’t be undone.`)) return
    setBusySlug(work.slug)
    setError(null)
    try {
      await api(`/works/${work.slug}`, { method: 'DELETE' })
      setWorks((list) => list.filter((w) => w.slug !== work.slug))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <div className="panel">
      <h3>Manage writing</h3>
      {error && <p className="error">{error}</p>}
      {!works && !error && <p>Loading…</p>}
      {works?.length === 0 && <p>Nothing uploaded yet.</p>}
      <ul className="works">
        {works?.map((work) => (
          <li key={work.slug}>
            <div className="row">
              <strong>{work.title}</strong>
              <span className="muted">
                {work.word_count.toLocaleString()} words · updated {new Date(work.updated_at).toLocaleDateString()}
              </span>
            </div>
            {replacing?.slug === work.slug ? (
              <UploadForm
                withTitle={false}
                initialText={replacing.text}
                submitLabel="Save replacement"
                onSubmit={(body) => replace(work, body)}
                onCancel={() => setReplacing(null)}
              />
            ) : (
              <div className="row">
                <button onClick={() => startReplace(work)} disabled={busySlug === work.slug}>
                  Replace
                </button>
                <button onClick={() => remove(work)} disabled={busySlug === work.slug}>
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
