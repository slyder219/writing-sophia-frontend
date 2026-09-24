import { useState } from 'react'
import { extractText, normalize } from '../lib/extractText'

// Shared by Upload (new work) and Manage → Replace (existing work).
// Only the text is saved: a chosen file is converted to raw text in the
// browser and dropped into the editor so it can be tweaked before saving.
export default function UploadForm({
  withTitle = true,
  initialText = '',
  submitLabel = 'Upload',
  onSubmit,
  onCancel,
}) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState(initialText)
  const [source, setSource] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const cleaned = normalize(text)
  const words = cleaned ? cleaned.split(/\s+/).length : 0
  const ready = cleaned && (!withTitle || title.trim()) && !extracting && !busy

  async function chooseFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setExtracting(true)
    try {
      setText(await extractText(file))
      setSource(file.name)
    } catch (err) {
      setError(err.message)
    } finally {
      setExtracting(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit(withTitle ? { title, text: cleaned } : { text: cleaned })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack upload-form" onSubmit={submit}>
      {withTitle && (
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      )}

      <label className="stack">
        <span>Load text from a file (Word, PDF, RTF, ODT, EPUB, HTML, text…)</span>
        <input type="file" onChange={chooseFile} disabled={extracting || busy} />
      </label>
      {extracting && <p>Reading text from file…</p>}

      <label className="stack">
        <span>
          Text {source && <span className="muted">· from {source}</span>} · {words.toLocaleString()} words — edit as needed
        </span>
        <textarea rows={16} placeholder="Paste or type text here" value={text} onChange={(e) => setText(e.target.value)} />
      </label>

      {error && <p className="error">{error}</p>}
      <div className="row">
        <button type="submit" disabled={!ready}>
          {busy ? 'Saving…' : submitLabel}
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
