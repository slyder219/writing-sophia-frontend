import { useState } from 'react'
import { extractText, normalize } from '../lib/extractText'

// Shared by Upload (new project) and Manage → Replace (existing project).
// Extracts text client-side so the user can verify it before submitting.
export default function UploadForm({ withTitle = true, submitLabel = 'Upload', onSubmit, onCancel }) {
  const [mode, setMode] = useState('file')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [fileText, setFileText] = useState('')
  const [pasted, setPasted] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const text = mode === 'file' ? fileText : normalize(pasted)
  const ready = text && (!withTitle || title.trim()) && !extracting && !busy

  async function chooseFile(e) {
    const chosen = e.target.files[0] ?? null
    setFile(chosen)
    setFileText('')
    setError(null)
    if (!chosen) return
    setExtracting(true)
    try {
      setFileText(await extractText(chosen))
    } catch (err) {
      setError(err.message)
    } finally {
      setExtracting(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    const body = new FormData()
    if (withTitle) body.append('title', title)
    body.append('text', text)
    if (mode === 'file') body.append('file', file)

    setBusy(true)
    setError(null)
    try {
      await onSubmit(body)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const words = text ? text.split(/\s+/).length : 0

  return (
    <form className="stack upload-form" onSubmit={submit}>
      {withTitle && (
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      )}

      <div className="mode-toggle">
        <label>
          <input type="radio" checked={mode === 'file'} onChange={() => setMode('file')} /> Upload file
        </label>
        <label>
          <input type="radio" checked={mode === 'paste'} onChange={() => setMode('paste')} /> Paste text
        </label>
      </div>

      {mode === 'file' ? (
        <input type="file" onChange={chooseFile} />
      ) : (
        <textarea rows={12} placeholder="Paste text here" value={pasted} onChange={(e) => setPasted(e.target.value)} />
      )}

      {extracting && <p>Reading text from file…</p>}
      {mode === 'file' && fileText && (
        <details className="preview" open>
          <summary>
            Extracted text · {words.toLocaleString()} words — check it looks right
          </summary>
          <pre>{fileText}</pre>
        </details>
      )}

      {error && <p className="error">{error}</p>}
      <div className="row">
        <button type="submit" disabled={!ready}>
          {busy ? 'Uploading…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
