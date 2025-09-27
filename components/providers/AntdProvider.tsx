'use client'

import { ConfigProvider, App } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
import { lightTheme, darkTheme } from '@/lib/antd-theme'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface AntdProviderProps {
  children: React.ReactNode
}

export default function AntdProvider({ children }: AntdProviderProps) {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <StyleProvider hashPriority="high">
        <ConfigProvider theme={lightTheme}>
          <App>
            {children}
          </App>
        </ConfigProvider>
      </StyleProvider>
    )
  }

  const currentTheme = theme === 'system' ? systemTheme : theme
  const antdTheme = currentTheme === 'dark' ? darkTheme : lightTheme

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