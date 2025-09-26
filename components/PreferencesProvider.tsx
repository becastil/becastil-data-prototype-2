'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type ThemePreference = 'system' | 'light' | 'dark'

type LandingPreference = '/dashboard' | '/upload' | '/help'

type Preferences = {
  theme: ThemePreference
  defaultLanding: LandingPreference
  timezone: string
}

interface PreferencesContextValue {
  preferences: Preferences
  initialized: boolean
  updatePreference: (updates: Partial<Preferences>) => void
  resetPreferences: () => void
}

const STORAGE_KEY = 'healthdash:preferences'

const defaultPreferences: Preferences = {
  theme: 'light',
  defaultLanding: '/dashboard',
  timezone:
    typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC',
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

function resolveTheme(preference: ThemePreference) {
  if (preference === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return preference
}

function applyTheme(theme: ThemePreference) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const resolved = resolveTheme(theme)
  root.classList.remove('dark')
  root.removeAttribute('data-theme')

  if (resolved === 'dark') {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dim')
  } else {
    root.setAttribute('data-theme', 'light')
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Preferences>
        setPreferences((prev) => ({ ...prev, ...parsed }))
        if (parsed.theme) {
          applyTheme(parsed.theme)
        } else {
          applyTheme(defaultPreferences.theme)
        }
      } else {
        applyTheme(defaultPreferences.theme)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      applyTheme(defaultPreferences.theme)
    } finally {
      setInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (!initialized) return
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error('Failed to persist preferences:', error)
    }
  }, [preferences, initialized])

  useEffect(() => {
    if (!initialized) return
    applyTheme(preferences.theme)
  }, [preferences.theme, initialized])

  useEffect(() => {
    if (!initialized) return
    if (preferences.theme !== 'system') return
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system')

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preferences.theme, initialized])

  const updatePreference = useCallback((updates: Partial<Preferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences)
  }, [])

  const value = useMemo(
    () => ({ preferences, initialized, updatePreference, resetPreferences }),
    [preferences, initialized, updatePreference, resetPreferences]
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
