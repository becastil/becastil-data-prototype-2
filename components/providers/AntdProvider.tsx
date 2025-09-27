'use client'

import { ConfigProvider, App } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
import { lightTheme, darkTheme } from '@/lib/antd-theme'
import { usePreferences } from '@/components/PreferencesProvider'
import { useEffect, useState } from 'react'

interface AntdProviderProps {
  children: React.ReactNode
}

export default function AntdProvider({ children }: AntdProviderProps) {
  const { preferences, initialized } = usePreferences()
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    if (!initialized) return

    const resolveTheme = () => {
      if (preferences.theme === 'system') {
        if (typeof window !== 'undefined') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return 'light'
      }
      return preferences.theme
    }

    setResolvedTheme(resolveTheme())

    if (preferences.theme !== 'system') return
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setResolvedTheme(event.matches ? 'dark' : 'light')
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preferences.theme, initialized])

  const antdTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider
        theme={antdTheme}
        button={{
          autoInsertSpace: false,
        }}
        space={{
          size: 'middle',
        }}
      >
        <App>
          {children}
        </App>
      </ConfigProvider>
    </StyleProvider>
  )
}