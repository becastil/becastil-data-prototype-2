'use client'

import { ReactNode } from 'react'
import { useFocusMode } from '@/components/focus/FocusProvider'
import HorizontalStepper from '@/components/ui/HorizontalStepper'
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
      
      {/* Horizontal Stepper */}
      <div className="border-b border-black/6 bg-[var(--background-elevated)] px-8 py-6">
        <HorizontalStepper currentStep={currentStep} />
      </div>
      
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Main Content */}
        <main 
          id="main-content"
          className={`flex-1 overflow-y-auto ${hideRightPanel ? '' : 'pr-80'}`}
          role="main"
          aria-label="Main dashboard content"
        >
          <div className="p-8">
            {children}
          </div>
        </main>

        {/* Right Panel - Contextual Information */}
        {!hideRightPanel && (
          <aside 
            className="fixed right-0 top-32 bottom-0 w-80 border-l border-black/6 bg-[var(--background-elevated)] backdrop-blur-lg"
            role="complementary"
            aria-label="Additional information and controls"
          >
            <div className="p-6 h-full overflow-y-auto">
              {rightPanel || (
                <div className="text-center text-gray-500 mt-20">
                  <div className="w-16 h-16 mx-auto mb-4 opacity-30" aria-hidden="true">
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