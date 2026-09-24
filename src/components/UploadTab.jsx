import { useState } from 'react'
import { api } from '../lib/api'
import UploadForm from './UploadForm'

export default function UploadTab() {
  const [uploaded, setUploaded] = useState(null)
  // Remount the form after each upload to clear it
  const [formKey, setFormKey] = useState(0)

  async function upload(body) {
    const project = await api('/projects', { method: 'POST', body })
    setUploaded(project)
    setFormKey((k) => k + 1)
  }

  return (
    <div className="panel">
      <h3>Upload writing</h3>
      {uploaded && (
        <p className="success">
          Uploaded “{uploaded.title}” ({uploaded.files.map((f) => f.name).join(', ')})
        </p>
      )}
      <UploadForm key={formKey} onSubmit={upload} />
    </div>
  )
}
