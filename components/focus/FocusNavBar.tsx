'use client'

import { useFocusMode } from './FocusProvider'
import { getNextStep, getPrevStep } from './focusSteps'

export default function FocusNavBar() {
  const {
    steps,
    currentStep,
    currentStepIndex,
    goToStep,
    nextStep,
    prevStep,
  } = useFocusMode()

  if (!currentStep) return null

  const isFirst = currentStepIndex <= 0
  const isLast = currentStepIndex >= steps.length - 1
  const nextStepData = getNextStep(currentStep.id)
  const prevStepData = getPrevStep(currentStep.id)

  const progress = ((currentStepIndex + 1) / steps.length) * 100

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-black/6 shadow-lg">
      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-black/10 rounded-full h-1">
            <div 
              className="bg-black h-1 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Left: Previous button */}
          <div className="flex-1">
            {!isFirst && (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors rounded-lg hover:bg-black/5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {prevStepData?.title || 'Previous'}
              </button>
            )}
          </div>

          {/* Center: Step indicators and current step info */}
          <div className="flex flex-col items-center gap-3">
            {/* Current step info */}
            <div className="text-center">
              <div className="text-sm font-semibold text-black">
                {currentStep.title}
              </div>
              {currentStep.description && (
                <div className="text-xs text-gray-600">
                  {currentStep.description}
                </div>
              )}
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-2">
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex
                const isCompleted = index < currentStepIndex
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`h-3 w-3 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-black scale-125'
                        : isCompleted
                        ? 'bg-black/60 hover:bg-black/80'
                        : 'bg-black/15 hover:bg-black/40'
                    }`}
                    aria-label={`Go to ${step.title}`}
                    aria-current={isActive ? 'step' : undefined}
                  />
                )
              })}
            </div>

            {/* Step counter and navigation hint */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span className="text-xs">
                Use ← → to navigate
              </span>
            </div>
          </div>

          {/* Right: Next button */}
          <div className="flex-1 flex justify-end">
            {!isLast ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-black/80 transition-colors"
              >
                {nextStepData?.title || 'Next'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Complete
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}