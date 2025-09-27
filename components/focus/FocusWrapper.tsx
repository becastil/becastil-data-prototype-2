'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { useFocusMode } from './FocusProvider'
import FocusNavBar from './FocusNavBar'

interface FocusWrapperProps {
  step?: number // Made optional since we now use sub-steps
  title?: string // Made optional since title comes from current step
  children: ReactNode
}

export default function FocusWrapper({ children }: FocusWrapperProps) {
  const { nextStep, prevStep } = useFocusMode()
  const [isVisible, setIsVisible] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true))
    return () => {
      cancelAnimationFrame(frame)
      setIsVisible(false)
    }
  }, [])

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

  // Always render in focus mode

  return (
    <>
      <div className="min-h-screen bg-white px-4 py-12 pb-32 sm:px-6 lg:px-12">
        <div className="mx-auto flex max-w-5xl flex-col">
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
        </div>
      </div>
      
      {/* Fixed navigation bar */}
      <FocusNavBar />
    </>
  )
}
