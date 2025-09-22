'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type SignInMode = 'magic' | 'password'

export default function LoginPage() {
  const [mode, setMode] = useState<SignInMode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleMagicLink = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    setMessage({
      type: 'success',
      text: 'Magic link sent! Check your email to finish signing in.',
    })
  }

  const handlePasswordLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Enter your email and we will send a reset link.' })
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) {
        throw new Error(error.message)
      }

      setMessage({
        type: 'success',
        text: 'Password reset instructions have been sent to your email.',
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to send reset email. Please try again later.' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      if (!email) {
        throw new Error('Please enter your email address.')
      }

      if (mode === 'magic') {
        await handleMagicLink()
      } else {
        if (!password) {
          throw new Error('Please enter your password.')
        }
        await handlePasswordLogin()
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'An unexpected error occurred.'
      setMessage({ type: 'error', text })
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = (targetMode: SignInMode) => {
    setMode(targetMode)
    setMessage(null)
    setPassword('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-blue-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Sign in to the Healthcare Analytics Dashboard
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => toggleMode('magic')}
            className={`w-full rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === 'magic'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 hover:text-blue-500 dark:text-slate-400'
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => toggleMode('password')}
            className={`w-full rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === 'password'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-600 hover:text-blue-500 dark:text-slate-400'
            }`}
          >
            Password
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode === 'password' && (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-left text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Forgot password?
              </button>
            </div>
          )}

          {message && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            {loading ? 'Processing…' : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>
            Need an account?{' '}
            <Link href="/auth/signup" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Create Account
            </Link>
          </p>
          <p>
            Prefer passwordless?{' '}
            <button
              type="button"
              onClick={() => toggleMode(mode === 'magic' ? 'password' : 'magic')}
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Switch to {mode === 'magic' ? 'password' : 'magic link'} mode
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
