import { useState } from 'react'
import { authClient } from '../lib/auth'

export default function AccountTab({ me }) {
  return (
    <div className="panel">
      <p>
        Signed in as {me.name} ({me.email}) · role: {me.role}
      </p>
      <ChangePassword />
      <button onClick={() => authClient.signOut()}>Sign out</button>
    </div>
  )
}

function ChangePassword() {
  const empty = { currentPassword: '', newPassword: '', confirm: '' }
  const [form, setForm] = useState(empty)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    if (form.newPassword !== form.confirm) {
      setMessage({ error: true, text: 'New passwords don’t match' })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const { error } = await authClient.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        revokeOtherSessions: true,
      })
      if (error) throw error
      setForm(empty)
      setMessage({ text: 'Password changed' })
    } catch (err) {
      setMessage({ error: true, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <h3>Change password</h3>
      <input name="currentPassword" type="password" placeholder="Current password" value={form.currentPassword} onChange={update} required />
      <input name="newPassword" type="password" placeholder="New password" minLength={8} value={form.newPassword} onChange={update} required />
      <input name="confirm" type="password" placeholder="Confirm new password" minLength={8} value={form.confirm} onChange={update} required />
      <button type="submit" disabled={busy}>
        Change password
      </button>
      {message && <p className={message.error ? 'error' : 'success'}>{message.text}</p>}
    </form>
  )
}
