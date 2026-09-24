import { useState } from 'react'
import { api } from '../lib/api'
import UploadForm from './UploadForm'

export default function UploadTab({ categories, reloadCategories }) {
  const [uploaded, setUploaded] = useState(null)
  // Remount the form after each upload to clear it
  const [formKey, setFormKey] = useState(0)

  async function upload(body) {
    const work = await api('/works', { method: 'POST', body: JSON.stringify(body) })
    setUploaded(work)
    setFormKey((k) => k + 1)
    reloadCategories()
  }

  return (
    <div className="panel">
      <h3>Upload writing</h3>
      {uploaded && (
        <p className="success">
          Saved “{uploaded.title}” ({uploaded.word_count.toLocaleString()} words)
        </p>
      )}
      <UploadForm key={formKey} onSubmit={upload} categories={categories} reloadCategories={reloadCategories} />
    </div>
  )
}
