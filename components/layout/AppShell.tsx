'use client'

import { ReactNode } from 'react'
import { useFocusMode } from '@/components/focus/FocusProvider'
import StepIndicator from './StepIndicator'
import TopBar from './TopBar'

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
  const { isFocusMode } = useFocusMode()

  if (isFocusMode) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <TopBar />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - Step Navigation */}
        <aside className="w-80 border-r border-white/6 bg-[var(--background-elevated)] backdrop-blur-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">
              Dashboard Workflow
            </h2>
            <StepIndicator currentStep={currentStep} />
          </div>
        </aside>

        {/* Center Panel - Main Content */}
        <main className={`flex-1 overflow-y-auto ${hideRightPanel ? '' : 'max-w-[calc(100%-20rem-20rem)]'}`}>
          <div className="p-8">
            {children}
          </div>
        </main>

        {/* Right Panel - Contextual Information */}
        {!hideRightPanel && (
          <aside className="w-80 border-l border-white/6 bg-[var(--background-elevated)] backdrop-blur-lg">
            <div className="p-6">
              {rightPanel || (
                <div className="text-center text-gray-400 mt-20">
                  <div className="w-16 h-16 mx-auto mb-4 opacity-30">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm">Contextual information will appear here</p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}