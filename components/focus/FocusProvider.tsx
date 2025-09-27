'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { focusSteps, getStepByPathAndSubStep, getStepIndex, getNextStep, getPrevStep, type FocusStep } from './focusSteps'

interface FocusContextValue {
  steps: FocusStep[]
  isFocusMode: boolean
  currentStepIndex: number
  currentStep: FocusStep | null
  currentSubStep: number
  goToStep: (index: number) => void
  goToStepById: (stepId: string) => void
  nextStep: () => void
  prevStep: () => void
  setSubStep: (subStep: number) => void
}

const FocusModeContext = createContext<FocusContextValue | undefined>(undefined)
FocusModeContext.displayName = 'FocusModeContext'

const STORAGE_KEY = 'dashboard-current-step'
const SUB_STEP_STORAGE_KEY = 'dashboard-current-substep'

export function FocusProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentSubStep, setCurrentSubStep] = useState(0)
  const [currentStepId, setCurrentStepId] = useState<string | null>(null)

  // Focus mode is always enabled
  const isFocusMode = true

  const currentStep = useMemo(() => {
    if (currentStepId) {
      return focusSteps.find(step => step.id === currentStepId) || null
    }
    // Fallback: find step by path and substep
    return getStepByPathAndSubStep(pathname, currentSubStep) || null
  }, [currentStepId, pathname, currentSubStep])

  const currentStepIndex = useMemo(() => {
    return currentStep ? getStepIndex(currentStep.id) : -1
  }, [currentStep])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedStepId = window.localStorage.getItem(STORAGE_KEY)
    const storedSubStep = window.localStorage.getItem(SUB_STEP_STORAGE_KEY)
    
    if (storedStepId) {
      setCurrentStepId(storedStepId)
    }
    if (storedSubStep) {
      setCurrentSubStep(parseInt(storedSubStep, 10))
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (currentStep) {
      window.localStorage.setItem(STORAGE_KEY, currentStep.id)
      window.localStorage.setItem(SUB_STEP_STORAGE_KEY, currentSubStep.toString())
    }
  }, [currentStep, currentSubStep])

  const goToStep = useCallback(
    (index: number) => {
      const target = focusSteps[index]
      if (!target) return
      setCurrentStepId(target.id)
      if (target.path !== pathname) {
        router.push(target.path)
      }
      if (target.subStep !== undefined) {
        setCurrentSubStep(target.subStep)
      }
    },
    [router, pathname],
  )

  const goToStepById = useCallback(
    (stepId: string) => {
      const stepIndex = getStepIndex(stepId)
      if (stepIndex >= 0) {
        goToStep(stepIndex)
      }
    },
    [goToStep],
  )

  const setSubStep = useCallback(
    (subStep: number) => {
      const step = getStepByPathAndSubStep(pathname, subStep)
      if (step) {
        setCurrentStepId(step.id)
        setCurrentSubStep(subStep)
      }
    },
    [pathname],
  )

  const nextStep = useCallback(() => {
    if (currentStep) {
      const next = getNextStep(currentStep.id)
      if (next) {
        const stepIndex = getStepIndex(next.id)
        goToStep(stepIndex)
      }
    }
  }, [currentStep, goToStep])

  const prevStep = useCallback(() => {
    if (currentStep) {
      const prev = getPrevStep(currentStep.id)
      if (prev) {
        const stepIndex = getStepIndex(prev.id)
        goToStep(stepIndex)
      }
    }
  }, [currentStep, goToStep])

  // Initialize to first step if no step is set
  useEffect(() => {
    if (!currentStep && focusSteps.length > 0) {
      goToStep(0)
    }
  }, [currentStep, goToStep])

  useEffect(() => {
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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [nextStep, prevStep])

  const value = useMemo<FocusContextValue>(() => ({
    steps: focusSteps,
    isFocusMode,
    currentStepIndex,
    currentStep,
    currentSubStep,
    goToStep,
    goToStepById,
    nextStep,
    prevStep,
    setSubStep,
  }), [currentStep, currentStepIndex, currentSubStep, goToStep, goToStepById, nextStep, prevStep, setSubStep, isFocusMode])

  return <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>
}

export function useFocusMode() {
  const context = useContext(FocusModeContext)
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusProvider')
  }
  return context
}

