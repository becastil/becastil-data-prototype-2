'use client'

import { ReactNode } from 'react'
import { useFocusMode } from './FocusProvider'
import { getStepsByPath } from './focusSteps'
import { usePathname } from 'next/navigation'

interface SubStepWrapperProps {
  subStep: number
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export default function SubStepWrapper({ 
  subStep, 
  title, 
  description,
  children, 
  className = '' 
}: SubStepWrapperProps) {
  const { currentSubStep } = useFocusMode()
  const pathname = usePathname()
  
  // Get all steps for current path to determine if this sub-step exists
  const pathSteps = getStepsByPath(pathname)
  const isValidSubStep = pathSteps.some(step => step.subStep === subStep)
  const isActiveSubStep = currentSubStep === subStep
  
  // Don't render if this is not a valid sub-step for the current path
  if (!isValidSubStep) {
    return null
  }
  
  // Don't render if this is not the active sub-step
  if (!isActiveSubStep) {
    return null
  }

  return (
    <div className={`focus-substep ${className}`}>
      {/* Sub-step header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black mb-2">{title}</h2>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      
      {/* Sub-step content */}
      <div className="focus-substep-content">
        {children}
      </div>
    </div>
  )
}

interface SubStepGroupProps {
  children: ReactNode
  className?: string
}

export function SubStepGroup({ children, className = '' }: SubStepGroupProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {children}
    </div>
  )
}