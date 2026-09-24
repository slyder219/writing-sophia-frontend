import { useState } from 'react'
import { api } from '../lib/api'

export default function CategoriesTab({ categories, reloadCategories }) {
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(null) // { id, name }
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function run(action) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await reloadCategories()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function add(e) {
    e.preventDefault()
    const ok = await run(() => api('/categories', { method: 'POST', body: JSON.stringify({ name: newName }) }))
    if (ok) setNewName('')
  }

  async function rename(e) {
    e.preventDefault()
    const ok = await run(() =>
      api(`/categories/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ name: editing.name }) }),
    )
    if (ok) setEditing(null)
  }

  function remove(category) {
    if (!confirm(`Delete the category “${category.name}”?`)) return
    run(() => api(`/categories/${category.id}`, { method: 'DELETE' }))
  }

  return (
    <div className="panel">
      <h3>Categories</h3>
      <form className="row" onSubmit={add}>
        <input placeholder="New category" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={100} required />
        <button type="submit" disabled={busy}>
          Add
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <ul className="works">
        {categories.map((c) => (
          <li key={c.id}>
            {editing?.id === c.id ? (
              <form className="row" onSubmit={rename}>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={100} required autoFocus />
                <button type="submit" disabled={busy}>
                  Save
                </button>
                <button type="button" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <div className="row">
                <strong>{c.name}</strong>
                <span className="muted">
                  {c.work_count} work{c.work_count === 1 ? '' : 's'}
                </span>
                <button onClick={() => setEditing({ id: c.id, name: c.name })} disabled={busy}>
                  Rename
                </button>
                <button
                  onClick={() => remove(c)}
                  disabled={busy || c.work_count > 0}
                  title={c.work_count > 0 ? 'Move its works to another category first' : undefined}
                >
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
