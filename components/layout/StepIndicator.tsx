'use client'

import { useFocusMode } from '@/components/focus/FocusProvider'
import { useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'

interface StepIndicatorProps {
  currentStep?: number
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
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

  const getStatusIcon = (status: string, validation: any) => {
    if (status === 'completed') {
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
    
    if (status === 'current') {
      return (
        <div className="w-6 h-6 rounded-full bg-cyan-500 border-2 border-cyan-300 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
      )
    }

    if (validation.warning) {
      return (
        <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }

    return (
      <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
      </div>
    )
  }

  return (
    <nav className="space-y-4">
      {steps.map((step, index) => {
        const status = getStepStatus(index)
        const validation = getStepValidation(step.id)
        const isClickable = status === 'completed' || status === 'current' || validation.isValid

        return (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              {getStatusIcon(status, validation)}
              {index < steps.length - 1 && (
                <div className="w-px h-8 bg-gray-300 mt-2"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <button
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={`text-left w-full group ${
                  isClickable 
                    ? 'cursor-pointer hover:text-black' 
                    : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    status === 'current' 
                      ? 'text-cyan-600' 
                      : status === 'completed'
                      ? 'text-emerald-600'
                      : 'text-gray-600'
                  }`}>
                    {step.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {index + 1} of {steps.length}
                  </span>
                </div>
                
                {validation.warning && validation.message && (
                  <p className="text-xs text-amber-600 mt-1">
                    {validation.message}
                  </p>
                )}
                
                {status === 'completed' && !validation.warning && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ Complete
                  </p>
                )}
              </button>
            </div>
          </div>
        )
      })}
    </nav>
  )
}