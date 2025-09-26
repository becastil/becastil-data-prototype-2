'use client'

import { useState, useRef, useEffect } from 'react'
import { usePreferences } from './PreferencesProvider'

const themeOptions = [
  { value: 'system', label: 'Match system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dim mode' },
] as const

const landingOptions = [
  { value: '/dashboard', label: 'Dashboard overview' },
  { value: '/upload', label: 'Upload workspace' },
  { value: '/help', label: 'Help & resources' },
] as const

const timezoneSuggestions = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Madrid',
  'Asia/Singapore',
  'Asia/Tokyo',
]

type ThemeValue = (typeof themeOptions)[number]['value']
type LandingValue = (typeof landingOptions)[number]['value']

export default function PreferencesTrigger() {
  const { preferences, initialized, updatePreference, resetPreferences } = usePreferences()
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!dialogRef.current) return
      if (dialogRef.current.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleThemeChange = (value: ThemeValue) => {
    updatePreference({ theme: value })
  }

  const handleLandingChange = (value: LandingValue) => {
    updatePreference({ defaultLanding: value })
  }

  const handleTimezoneChange = (value: string) => {
    if (!value) return
    updatePreference({ timezone: value })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!initialized}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/80 dark:hover:text-blue-200"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.078 2.251a1 1 0 011.844 0l.7 1.802a1 1 0 00.95.641h1.897a1 1 0 01.592 1.806l-1.538 1.185a1 1 0 00-.364 1.118l.588 1.812a1 1 0 01-1.45 1.146l-1.618-.94a1 1 0 00-1.146 0l-1.618.94a1 1 0 01-1.45-1.146l.588-1.812a1 1 0 00-.364-1.118l-1.538-1.185a1 1 0 01.592-1.806h1.897a1 1 0 00.95-.641l.7-1.802z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Preferences
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            ref={dialogRef}
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Workspace preferences</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Make it yours</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  Personalize theme, landing page, and time zone. Settings are remembered on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <span className="sr-only">Close preferences</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-8">
              <section>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Theme</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Choose your preferred color mode. Dim mode softens the interface to a graphite palette.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleThemeChange(option.value)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        preferences.theme === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-200'
                          : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/70 dark:hover:text-blue-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Default landing view</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">This is the page we’ll route you to after signing in.</p>
                <div className="mt-3 space-y-3">
                  {landingOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                        preferences.defaultLanding === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-200'
                          : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/70 dark:hover:text-blue-200'
                      }`}
                    >
                      <input
                        type="radio"
                        className="mt-1 h-4 w-4 border-blue-500 text-blue-600 focus:ring-blue-500"
                        name="landing"
                        value={option.value}
                        checked={preferences.defaultLanding === option.value}
                        onChange={() => handleLandingChange(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Time zone</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  Used for scheduling reports and interpreting cost trends. Start typing to search for a zone.
                </p>
                <div className="mt-3">
                  <input
                    type="text"
                    defaultValue={preferences.timezone}
                    list="timezone-suggestions"
                    onBlur={(event) => handleTimezoneChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleTimezoneChange((event.target as HTMLInputElement).value)
                        setOpen(false)
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500/70 dark:focus:ring-blue-900/30"
                    placeholder="e.g. America/New_York"
                  />
                  <datalist id="timezone-suggestions">
                    {timezoneSuggestions.map((tz) => (
                      <option key={tz} value={tz} />
                    ))}
                  </datalist>
                </div>
              </section>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  resetPreferences()
                  setOpen(false)
                }}
                className="text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                Reset to defaults
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Done
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
