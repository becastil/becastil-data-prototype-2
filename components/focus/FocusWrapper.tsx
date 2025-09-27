'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { useFocusMode } from './FocusProvider'
import FocusControls from './FocusControls'

interface FocusWrapperProps {
  step: number
  title: string
  children: ReactNode
}

export default function FocusWrapper({ step, title, children }: FocusWrapperProps) {
  const { isFocusMode, currentStepIndex, steps, nextStep, prevStep } = useFocusMode()
  const stepIndex = step - 1
  const isRecognizedStep = stepIndex >= 0 && stepIndex < steps.length
  const isActiveStep = isRecognizedStep && currentStepIndex === stepIndex
  const [isVisible, setIsVisible] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (isFocusMode && isActiveStep) {
      const frame = requestAnimationFrame(() => setIsVisible(true))
      return () => {
        cancelAnimationFrame(frame)
        setIsVisible(false)
      }
    }
    setIsVisible(false)
    return undefined
  }, [isActiveStep, isFocusMode])

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    touchStartRef.current = null

    if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > 40) return

    if (deltaX < 0) {
      nextStep()
    } else if (deltaX > 0) {
      prevStep()
    }
  }

  if (!isFocusMode || !isRecognizedStep || currentStepIndex === -1) {
    return <>{children}</>
  }

  if (!isActiveStep) {
    return null
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <FocusControls title={title} variant="header" />

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`relative w-full rounded-3xl border border-black/10 bg-white p-6 shadow-lg transition-all duration-300 ease-out sm:p-10 ${
            isVisible ? 'opacity-100 shadow-xl' : 'translate-y-3 opacity-0'
          }`}
        >
          <div className="focus-visible:outline-none">
            {children}
          </div>
        </div>

        <FocusControls title={title} variant="footer" />
      </div>
    </div>
  )
}
