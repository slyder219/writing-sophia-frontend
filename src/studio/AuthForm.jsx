import { useState } from 'react'
import { api } from '../lib/api'
import { authClient } from '../lib/auth'

export default function AuthForm() {
  const [mode, setMode] = useState('signUp')
  const [form, setForm] = useState({ username: '', email: '', login: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Neon Auth has no usernames: the backend claims the account's name as its
  // username on first use, so check it's free before creating the account
  async function signUp() {
    const check = await api(`/usernames/${encodeURIComponent(form.username)}`)
    if (!check.available) return check.error
    const { error } = await authClient.signUp.email({ name: check.username, email: form.email, password: form.password })
    return error?.message
  }

  // Email or username; a username is swapped for its email only when the
  // password is right
  async function signIn() {
    let email = form.login.trim()
    if (!email.includes('@')) {
      const found = await api('/usernames/sign-in', {
        method: 'POST',
        body: JSON.stringify({ username: email, password: form.password }),
      })
      email = found.email
    }
    const { error } = await authClient.signIn.email({ email, password: form.password })
    return error?.message
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const message = await (mode === 'signUp' ? signUp() : signIn())
      if (message) setError(message)
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
      {isSignUp ? (
        <>
          <input
            name="username"
            placeholder="Username"
            aria-label="Username"
            autoComplete="username"
            value={form.username}
            onChange={update}
            pattern="[A-Za-z0-9_]{3,20}"
            title="3–20 letters, numbers or _"
            required
          />
          <input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" value={form.email} onChange={update} required />
        </>
      ) : (
        <input
          name="login"
          placeholder="Email or username"
          aria-label="Email or username"
          autoComplete="username"
          value={form.login}
          onChange={update}
          required
        />
      )}
      <input
        name="password"
        type="password"
        placeholder="Password"
        aria-label="Password"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
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
