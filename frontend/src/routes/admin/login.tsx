import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormAlert } from '#/components/admin/AdminUi'
import { TextField } from '#/components/admin/Fields'
import { buttonClass } from '#/components/ui/button'
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
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-10">
      <form
        className="grid w-full max-w-md gap-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200/70 sm:p-8"
        onSubmit={submit}
        noValidate
      >
        <div>
          <h1 className="font-heading text-[1.75rem] leading-tight font-semibold text-navy-950">
            {m.admin.title}
          </h1>
          <p className="mt-2 text-slate-700">{m.admin.loginIntro}</p>
        </div>
        {error ? <FormAlert title={m.admin.errorTitle} text={error} /> : null}
        <TextField
          id="admin-email"
          label={m.admin.email}
          type="email"
          autoComplete="username"
          value={email}
          onChange={setEmail}
          required
        />
        <TextField
          id="admin-password"
          label={m.admin.password}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />
        <button
          className={buttonClass('primary', 'md', 'w-full')}
          type="submit"
          disabled={busy}
        >
          {busy ? m.admin.signingIn : m.admin.signIn}
        </button>
      </form>
    </main>
  )
}
