import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertIcon } from '#/components/Icon'
import { adminFetch, fetchMe } from '#/lib/admin'
import { m } from '#/lib/i18n'

export const Route = createFileRoute('/admin/login')({
  // The session cookie lives in the browser, so this page is checked there, not on the server.
  ssr: false,
  beforeLoad: async () => {
    if (await fetchMe()) throw redirect({ to: '/admin' })
  },
  head: () => ({
    meta: [
      { title: `${m.admin.title} | ${m.admin.siteName}` },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError(m.admin.errorRequired)
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await adminFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (response.ok) {
        await navigate({ to: '/admin' })
        return
      }
      // 401 (wrong details) and 429 (too many tries) both come with a readable message.
      const data = (await response.json().catch(() => null)) as {
        detail?: string
      } | null
      setError(
        response.status === 401 || response.status === 429
          ? (data?.detail ?? m.admin.errorGeneric)
          : m.admin.errorGeneric,
      )
    } catch {
      setError(m.admin.errorNetwork)
    }
    setBusy(false)
  }

  return (
    <main className="admin-login">
      <form className="admin-card stack" onSubmit={submit} noValidate>
        <div>
          <h1>{m.admin.title}</h1>
          <p className="muted">{m.admin.loginIntro}</p>
        </div>
        {error ? (
          <div className="form-alert" role="alert">
            <AlertIcon />
            <div>
              <strong>{m.admin.errorTitle}</strong>
              <p>{error}</p>
            </div>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="admin-email">{m.admin.email}</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="admin-password">{m.admin.password}</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? m.admin.signingIn : m.admin.signIn}
        </button>
      </form>
    </main>
  )
}
