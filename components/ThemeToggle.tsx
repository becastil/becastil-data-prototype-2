'use client'

import { useEffect, useState } from 'react'
import { usePreferences } from './PreferencesProvider'

type ResolvedTheme = 'light' | 'dark'

function resolveTheme(preference: 'system' | 'light' | 'dark'): ResolvedTheme {
  if (preference === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return preference
}

export default function ThemeToggle() {
  const { preferences, updatePreference, initialized } = usePreferences()
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(preferences.theme))

  useEffect(() => {
    setResolvedTheme(resolveTheme(preferences.theme))

    if (preferences.theme !== 'system') return
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setResolvedTheme(event.matches ? 'dark' : 'light')
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preferences.theme])

  const isDim = resolvedTheme === 'dark'

  const handleToggle = () => {
    if (!initialized) return
    updatePreference({ theme: isDim ? 'light' : 'dark' })
  }

  const buttonLabel = isDim ? 'Switch to light mode' : 'Switch to dim mode'

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!initialized}
      aria-label={buttonLabel}
      title={buttonLabel}
      className={
        'inline-flex items-center gap-2 rounded-full border bg-[var(--surface)] px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 [border-color:var(--surface-border)]'
      }
    >
      <span className="flex h-4 w-4 items-center justify-center text-[var(--foreground)]">
        {isDim ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M12 4a1 1 0 011-1h0a1 1 0 110 2h0a1 1 0 01-1-1zm0 15a1 1 0 011 1h0a1 1 0 01-2 0h0a1 1 0 011-1zm8-7a1 1 0 110 2h0a1 1 0 110-2h0zM5 12a1 1 0 01-1 1h0a1 1 0 110-2h0a1 1 0 011 1zm13.07 6.07a1 1 0 011.41 1.41h0a1 1 0 11-1.41-1.41h0zM5.93 5.93a1 1 0 11-1.41-1.41h0a1 1 0 111.41 1.41h0zm0 12.14a1 1 0 11-1.41 1.41h0a1 1 0 111.41-1.41h0zM18.36 5.64a1 1 0 11-1.41-1.41h0a1 1 0 011.41 1.41h0zM12 7a5 5 0 100 10A5 5 0 0012 7z" />
          </svg>
        )}
      </span>
      <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] sm:inline">
        {isDim ? 'Dim' : 'Light'}
      </span>
    </button>
  )
}
