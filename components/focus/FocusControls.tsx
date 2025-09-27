'use client'

import { useFocusMode } from './FocusProvider'

interface FocusControlsProps {
  title: string
  variant?: 'header' | 'footer'
}

export default function FocusControls({ title, variant = 'header' }: FocusControlsProps) {
  const {
    steps,
    currentStepIndex,
    disableFocusMode,
    goToStep,
    nextStep,
    prevStep,
  } = useFocusMode()
  const resolvedIndex = currentStepIndex >= 0 ? currentStepIndex : 0

  if (variant === 'footer') {
    const isFirst = resolvedIndex <= 0
    const isLast = resolvedIndex >= steps.length - 1

    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={disableFocusMode}
          className="self-start text-sm font-medium text-black/50 underline-offset-4 transition hover:text-black"
        >
          Exit Focus Mode
        </button>
        <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
          <button
            type="button"
            onClick={prevStep}
            disabled={isFirst}
            className={`inline-flex items-center justify-center rounded-full border border-black/20 px-5 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 ${
              isFirst
                ? 'cursor-not-allowed border-black/10 text-black/30'
                : 'bg-white text-black hover:border-black/40 hover:bg-black/5'
            }`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={isLast ? disableFocusMode : nextStep}
            className={`inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 ${
              isLast
                ? 'bg-black text-white hover:bg-black/80'
                : 'border border-black/80 bg-black text-white hover:bg-black/80'
            }`}
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-black/40">
        <span>Focus Mode</span>
        <button
          type="button"
          onClick={disableFocusMode}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-black/60 transition hover:text-black"
        >
          Exit
        </button>
      </div>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-sm font-semibold text-black">{title}</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isActive = index === resolvedIndex
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    isActive ? 'bg-black' : 'bg-black/15 hover:bg-black/40'
                  }`}
                  aria-label={`Go to ${step.title}`}
                  aria-current={isActive ? 'step' : undefined}
                />
              )
            })}
          </div>
          <span className="text-xs font-medium text-black/60">
            Step {resolvedIndex + 1} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  )
}
