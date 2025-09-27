'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export interface FocusStep {
  id: string
  title: string
  path: string
}

export const focusSteps: FocusStep[] = [
  { id: 'upload', title: 'Upload CSV', path: '/dashboard/upload' },
  { id: 'fees', title: 'Monthly Fees', path: '/dashboard/fees' },
  { id: 'table', title: 'Summary Table', path: '/dashboard/table' },
  { id: 'charts', title: 'Charts', path: '/dashboard/charts' },
]

interface FocusContextValue {
  steps: FocusStep[]
  isFocusMode: boolean
  currentStepIndex: number
  currentStep: FocusStep | null
  enableFocusMode: () => void
  disableFocusMode: () => void
  toggleFocusMode: () => void
  goToStep: (index: number) => void
  nextStep: () => void
  prevStep: () => void
}

const FocusModeContext = createContext<FocusContextValue | undefined>(undefined)
FocusModeContext.displayName = 'FocusModeContext'

const STORAGE_KEY = 'dashboard-focus-mode'

export function FocusProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isFocusMode, setIsFocusMode] = useState(false)

  const currentStepIndex = useMemo(() => {
    return focusSteps.findIndex(step => step.path === pathname)
  }, [pathname])

  const currentStep = currentStepIndex >= 0 ? focusSteps[currentStepIndex] : null

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      setIsFocusMode(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, isFocusMode ? 'true' : 'false')
  }, [isFocusMode])

  const goToStep = useCallback(
    (index: number) => {
      const target = focusSteps[index]
      if (!target) return
      router.push(target.path)
    },
    [router],
  )

  const nextStep = useCallback(() => {
    if (currentStepIndex < focusSteps.length - 1 && currentStepIndex >= 0) {
      goToStep(currentStepIndex + 1)
    }
  }, [currentStepIndex, goToStep])

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1)
    }
  }, [currentStepIndex, goToStep])

  const enableFocusMode = useCallback(() => {
    setIsFocusMode(true)
    if (currentStepIndex === -1) {
      goToStep(0)
    }
  }, [currentStepIndex, goToStep])

  const disableFocusMode = useCallback(() => {
    setIsFocusMode(false)
  }, [])

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      const nextValue = !prev
      if (!prev && currentStepIndex === -1) {
        goToStep(0)
      }
      return nextValue
    })
  }, [currentStepIndex, goToStep])

  useEffect(() => {
    if (!isFocusMode) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isEditable =
        target?.isContentEditable ||
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select'

      if (isEditable) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        nextStep()
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prevStep()
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        disableFocusMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [disableFocusMode, isFocusMode, nextStep, prevStep])

  const value = useMemo<FocusContextValue>(() => ({
    steps: focusSteps,
    isFocusMode,
    currentStepIndex,
    currentStep,
    enableFocusMode,
    disableFocusMode,
    toggleFocusMode,
    goToStep,
    nextStep,
    prevStep,
  }), [currentStep, currentStepIndex, disableFocusMode, enableFocusMode, goToStep, isFocusMode, nextStep, prevStep, toggleFocusMode])

  return <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>
}

export function useFocusMode() {
  const context = useContext(FocusModeContext)
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusProvider')
  }
  return context
}

export function FocusToggleButton({ className }: { className?: string }) {
  const { isFocusMode, enableFocusMode, disableFocusMode } = useFocusMode()

  const handleClick = () => {
    if (isFocusMode) {
      disableFocusMode()
    } else {
      enableFocusMode()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`btn-premium ${
        isFocusMode ? 'btn-premium--primary' : 'btn-premium--secondary'
      } text-sm ${className ?? ''}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
    </button>
  )
}
