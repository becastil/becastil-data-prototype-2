'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStepCompletion } from '@/lib/store/useAppStore'

const steps = [
  {
    id: 'upload',
    label: 'Upload CSV',
    href: '/dashboard/upload',
    description: 'Upload your experience data CSV file'
  },
  {
    id: 'fees',
    label: 'Monthly Fees',
    href: '/dashboard/fees',
    description: 'Enter monthly TPA and administrative fees'
  },
  {
    id: 'table',
    label: 'Summary Table',
    href: '/dashboard/table',
    description: 'Review calculated monthly summaries'
  },
  {
    id: 'charts',
    label: 'Charts & Analysis',
    href: '/dashboard/charts',
    description: 'View interactive charts and analytics'
  }
] as const

export default function StepNav() {
  const pathname = usePathname()
  const stepCompletion = useStepCompletion()
  
  return (
    <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Dashboard Workflow
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Complete each step to generate your report
        </p>
      </div>
      
      {/* Steps */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isCompleted = stepCompletion[step.id as keyof typeof stepCompletion]
            const isActive = pathname === step.href
            const isDisabled = getStepDisabled(step.id, stepCompletion)
            
            return (
              <div key={step.id} className="relative">
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
                )}
                
                <Link
                  href={isDisabled ? '#' : step.href}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                      : isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                  onClick={isDisabled ? (e) => e.preventDefault() : undefined}
                  title={isDisabled ? getDisabledTooltip(step.id, stepCompletion) : step.description}
                >
                  {/* Step indicator */}
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${isCompleted
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className={`
                      text-sm font-medium 
                      ${isActive 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-gray-900 dark:text-gray-100'
                      }
                    `}>
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {step.description}
                    </div>
                    {isDisabled && (
                      <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                        Complete previous steps first
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              const store = (window as any).__appStore
              if (store?.clearAllData) {
                store.clearAllData()
                window.location.href = '/dashboard/upload'
              }
            }
          }}
          className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Clear All Data
        </button>
      </div>
    </nav>
  )
}

function getStepDisabled(stepId: string, completion: any): boolean {
  switch (stepId) {
    case 'upload':
      return false
    case 'fees':
      return !completion.upload
    case 'table':
      return !completion.upload || !completion.fees
    case 'charts':
      return !completion.upload || !completion.fees
    default:
      return false
  }
}

function getDisabledTooltip(stepId: string, completion: any): string {
  switch (stepId) {
    case 'fees':
      return 'Upload a CSV file first'
    case 'table':
    case 'charts':
      return completion.upload 
        ? 'Complete the fees form first'
        : 'Upload a CSV file and complete fees first'
    default:
      return ''
  }
}