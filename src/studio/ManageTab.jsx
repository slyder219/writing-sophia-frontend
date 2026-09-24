import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import CategorySelect from './CategorySelect'
import UploadForm from './UploadForm'

const UNCATEGORIZED = 'none'

export default function ManageTab({ categories, reloadCategories }) {
  const [works, setWorks] = useState(null)
  const [error, setError] = useState(null)
  const [replacing, setReplacing] = useState(null) // { slug, text }
  const [busySlug, setBusySlug] = useState(null)
  const [dragging, setDragging] = useState(null) // slug
  const [dropTarget, setDropTarget] = useState(null) // category id

  useEffect(() => {
    api('/works')
      .then(setWorks)
      .catch((err) => setError(err.message))
  }, [])

  const updateWork = (updated) => setWorks((list) => list.map((w) => (w.slug === updated.slug ? updated : w)))

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
    updateWork(await api(`/works/${work.slug}`, { method: 'PUT', body: JSON.stringify(body) }))
    setReplacing(null)
  }

  // Moves optimistically so a drop feels instant; reverts if the save fails
  async function setCategory(work, categoryId) {
    if (work.category_id === categoryId) return
    setBusySlug(work.slug)
    setError(null)
    updateWork({ ...work, category_id: categoryId })
    try {
      updateWork(
        await api(`/works/${work.slug}/category`, {
          method: 'PATCH',
          body: JSON.stringify({ category_id: categoryId }),
        }),
      )
      reloadCategories()
    } catch (err) {
      updateWork(work)
      setError(err.message)
    } finally {
      setBusySlug(null)
    }
  }

  async function remove(work) {
    if (!confirm(`Delete “${work.title}”? This can’t be undone.`)) return
    setBusySlug(work.slug)
    setError(null)
    try {
      await api(`/works/${work.slug}`, { method: 'DELETE' })
      setWorks((list) => list.filter((w) => w.slug !== work.slug))
      reloadCategories()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusySlug(null)
    }
  }

  function dropOn(categoryId) {
    const work = works.find((w) => w.slug === dragging)
    setDragging(null)
    setDropTarget(null)
    if (work) setCategory(work, categoryId)
  }

  if (error && !works) return <p className="error">{error}</p>
  if (!works) return <p>Loading…</p>

  // Every category gets a section (empty ones are drop targets), plus a
  // catch-all for works whose category no longer exists
  const known = new Set(categories.map((c) => c.id))
  const groups = categories.map((c) => ({ id: c.id, name: c.name, works: works.filter((w) => w.category_id === c.id) }))
  const orphans = works.filter((w) => !known.has(w.category_id))
  if (orphans.length) groups.push({ id: UNCATEGORIZED, name: 'Uncategorized', works: orphans })

  return (
    <div className="panel">
      <h3>Manage writing</h3>
      <p className="muted">Drag a piece onto another category to move it.</p>
      {error && <p className="error">{error}</p>}
      {works.length === 0 && <p>Nothing uploaded yet.</p>}

      {groups.map((group) => {
        const droppable = group.id !== UNCATEGORIZED && dragging
        return (
          <section
            key={group.id}
            className={`manage-group${dropTarget === group.id ? ' drop-target' : ''}`}
            onDragOver={(e) => {
              if (!droppable) return
              e.preventDefault()
              setDropTarget(group.id)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (droppable) dropOn(group.id)
            }}
          >
            <h4>
              {group.name} <span className="muted">({group.works.length})</span>
            </h4>
            {group.works.length === 0 ? (
              <p className="muted empty-group">{dragging ? 'Drop here' : 'Nothing in this category'}</p>
            ) : (
              <ul className="works">
                {group.works.map((work) => (
                  <li
                    key={work.slug}
                    className={dragging === work.slug ? 'dragging' : ''}
                    draggable={!replacing && busySlug !== work.slug}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', work.slug)
                      setDragging(work.slug)
                    }}
                    onDragEnd={() => {
                      setDragging(null)
                      setDropTarget(null)
                    }}
                  >
                    <div className="row work-row">
                      <span className="drag-handle" aria-hidden="true">
                        ⠿
                      </span>
                      <strong>{work.title}</strong>
                      <span className="muted">
                        {work.word_count.toLocaleString()} words · updated{' '}
                        {new Date(work.updated_at).toLocaleDateString()}
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
                      <div className="row work-actions">
                        <label className="row">
                          <span className="muted">Move to</span>
                          <CategorySelect
                            value={known.has(work.category_id) ? work.category_id : null}
                            onChange={(id) => setCategory(work, id)}
                            categories={categories}
                            reloadCategories={reloadCategories}
                            disabled={busySlug === work.slug}
                          />
                        </label>
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
            )}
          </section>
        )
      })}
    </div>
  )
}
