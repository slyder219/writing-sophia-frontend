import { useState } from 'react'
import { api } from '../lib/api'

const NEW = '__new__'

// Category dropdown with a "+ New category…" option that creates one inline.
export default function CategorySelect({ value, onChange, categories, reloadCategories, disabled }) {
  const [error, setError] = useState(null)

  async function change(e) {
    setError(null)
    if (e.target.value !== NEW) {
      onChange(Number(e.target.value))
      return
    }
    const name = prompt('New category name')?.trim()
    if (!name) return
    try {
      const created = await api('/categories', { method: 'POST', body: JSON.stringify({ name }) })
      await reloadCategories()
      onChange(created.id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <span className="category-select">
      <select value={value ?? ''} onChange={change} disabled={disabled} required>
        <option value="" disabled>
          Choose a category…
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        <option value={NEW}>+ New category…</option>
      </select>
      {error && <span className="error"> {error}</span>}
    </span>
  )
}
