import { useState } from 'react'
import { authClient } from '../lib/auth'

export default function AuthForm() {
  const [mode, setMode] = useState('signUp')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error } =
        mode === 'signUp'
          ? await authClient.signUp.email(form)
          : await authClient.signIn.email({ email: form.email, password: form.password })
      if (error) setError(error.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const isSignUp = mode === 'signUp'

  return (
    <form className="auth-form" onSubmit={submit}>
      <h2>{isSignUp ? 'Sign up' : 'Sign in'}</h2>
      {isSignUp && (
        <input name="name" placeholder="Name" value={form.name} onChange={update} required />
      )}
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} required />
      <input
        name="password"
        type="password"
        placeholder="Password"
        minLength={8}
        value={form.password}
        onChange={update}
        required
      />
      <button type="submit" disabled={busy}>
        {isSignUp ? 'Create account' : 'Sign in'}
      </button>
      {error && <p className="error">{error}</p>}
      <button type="button" className="link" onClick={() => setMode(isSignUp ? 'signIn' : 'signUp')}>
        {isSignUp ? 'Have an account? Sign in' : 'New here? Sign up'}
      </button>
    </form>
  )
}
