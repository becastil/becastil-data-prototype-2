'use client'

import { ReactNode } from 'react'
import { AppStoreProviderInternal } from './useAppStore'

export function AppStoreProvider({ children }: { children: ReactNode }) {
  return <AppStoreProviderInternal>{children}</AppStoreProviderInternal>
}