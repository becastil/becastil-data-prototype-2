'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'

interface MotionContextType {
  prefersReducedMotion: boolean
}

const MotionContext = createContext<MotionContextType>({
  prefersReducedMotion: false
})

export function useMotion() {
  return useContext(MotionContext)
}

interface MotionProviderProps {
  children: ReactNode
}

export default function MotionProvider({ children }: MotionProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const motionConfig = {
    // Reduce animation duration and disable complex animations for reduced motion
    transition: prefersReducedMotion ? {
      duration: 0.01,
      ease: "linear"
    } : {
      duration: 0.2,
      ease: "easeOut"
    }
  }

  return (
    <MotionContext.Provider value={{ prefersReducedMotion }}>
      <MotionConfig {...motionConfig}>
        {children}
      </MotionConfig>
    </MotionContext.Provider>
  )
}