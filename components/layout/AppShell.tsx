'use client'

import { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
  rightPanel?: ReactNode
  hideRightPanel?: boolean
  currentStep?: number
}

export default function AppShell({
  children,
  rightPanel,
  hideRightPanel = false,
  currentStep,
}: AppShellProps) {
  // Always return children directly since focus mode is always active
  return <>{children}</>

}
}