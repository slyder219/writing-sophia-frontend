import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import UploadForm from './UploadForm'

export default function ManageTab() {
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState(null)
  const [replacing, setReplacing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = () =>
    api('/projects')
      .then(setProjects)
      .catch((err) => setError(err.message))

  useEffect(() => {
    load()
  }, [])

  async function remove(project) {
    if (!confirm(`Delete “${project.title}” and everything in its folder?`)) return
    setDeleting(project.id)
    setError(null)
    try {
      await api(`/projects/${project.id}`, { method: 'DELETE' })
      setProjects((list) => list.filter((p) => p.id !== project.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  async function replace(project, body) {
    const updated = await api(`/projects/${project.id}`, { method: 'PUT', body })
    setProjects((list) => list.map((p) => (p.id === updated.id ? updated : p)))
    setReplacing(null)
  }

  return (
    <div className="panel">
      <h3>Manage writing</h3>
      {error && <p className="error">{error}</p>}
      {!projects && !error && <p>Loading…</p>}
      {projects?.length === 0 && <p>Nothing uploaded yet.</p>}
      <ul className="projects">
        {projects?.map((project) => (
          <li key={project.id}>
            <div className="row">
              <strong>{project.title}</strong>
              <span className="muted">{project.files.map((f) => f.name).join(', ')}</span>
            </div>
            {replacing === project.id ? (
              <UploadForm
                withTitle={false}
                submitLabel="Replace"
                onSubmit={(body) => replace(project, body)}
                onCancel={() => setReplacing(null)}
              />
            ) : (
              <div className="row">
                <button onClick={() => setReplacing(project.id)}>Replace</button>
                <button onClick={() => remove(project)} disabled={deleting === project.id}>
                  {deleting === project.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
