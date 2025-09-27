'use client'

import { useFocusMode } from '@/components/focus/FocusProvider'
import { useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'

interface HorizontalStepperProps {
  currentStep?: number
  className?: string
}

export default function HorizontalStepper({ currentStep, className = '' }: HorizontalStepperProps) {
  const { steps, currentStepIndex, goToStep } = useFocusMode()
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'pending'
  }

  const getStepValidation = (stepId: string) => {
    switch (stepId) {
      case 'upload':
        return {
          isValid: experience.length > 0 && highCostClaimants.length > 0,
          warning: experience.length === 0 || highCostClaimants.length === 0,
          message: experience.length === 0 && highCostClaimants.length === 0 
            ? 'Upload both templates to continue' 
            : experience.length === 0 
            ? 'Experience data required'
            : 'High-cost claimants data required'
        }
      case 'fees':
        return { isValid: true, warning: false, message: '' }
      case 'table':
        return { 
          isValid: experience.length > 0,
          warning: experience.length === 0,
          message: experience.length === 0 ? 'Experience data required' : ''
        }
      case 'charts':
        return { 
          isValid: experience.length > 0,
          warning: experience.length === 0,
          message: experience.length === 0 ? 'Experience data required' : ''
        }
      default:
        return { isValid: true, warning: false, message: '' }
    }
  }

  const getStepIcon = (status: string, validation: any, stepIndex: number) => {
    if (status === 'completed') {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
    
    if (status === 'current') {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-white font-medium text-sm">
          {stepIndex + 1}
        </div>
      )
    }

    if (validation.warning) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300">
          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 text-gray-500 font-medium text-sm">
        {stepIndex + 1}
      </div>
    )
  }

  return (
    <nav className={`w-full ${className}`} aria-label="Dashboard workflow progress" role="navigation">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const validation = getStepValidation(step.id)
          const isClickable = status === 'completed' || status === 'current' || validation.isValid
          const isLast = index === steps.length - 1

          return (
            <li key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center relative">
                {/* Step Icon */}
                <button
                  onClick={() => isClickable && goToStep(index)}
                  disabled={!isClickable}
                  className={`relative z-10 focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:outline-none rounded-full ${
                    isClickable 
                      ? 'cursor-pointer hover:scale-105 transition-transform duration-150' 
                      : 'cursor-not-allowed opacity-60'
                  }`}
                  aria-current={status === 'current' ? 'step' : undefined}
                  aria-label={`${step.title} - Step ${index + 1} of ${steps.length}${
                    status === 'completed' ? ' (completed)' : 
                    status === 'current' ? ' (current)' : 
                    validation.warning ? ' (requires action)' : ''
                  }`}
                  aria-describedby={validation.warning && validation.message ? `step-${index}-error` : undefined}
                >
                  {getStepIcon(status, validation, index)}
                </button>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    status === 'current' 
                      ? 'text-[var(--accent)]' 
                      : status === 'completed'
                      ? 'text-emerald-600'
                      : validation.warning
                      ? 'text-amber-600'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  
                  {validation.warning && validation.message && (
                    <div 
                      id={`step-${index}-error`}
                      className="text-xs text-amber-600 mt-1 max-w-24 leading-tight"
                      role="alert"
                    >
                      {validation.message}
                    </div>
                  )}
                  
                  {status === 'completed' && !validation.warning && (
                    <div className="text-xs text-emerald-600 mt-1">
                      ✓ Complete
                    </div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 h-px mx-4 relative">
                  <div 
                    className={`absolute inset-0 h-px ${
                      status === 'completed' 
                        ? 'bg-emerald-500' 
                        : 'bg-gray-300'
                    } transition-colors duration-300`}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}