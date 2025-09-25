'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStepCompletion } from '@/lib/store/useAppStore'

const steps = [
  {
    id: 'upload',
    label: 'Upload CSV',
    href: '/dashboard/upload'
  },
  {
    id: 'fees',
    label: 'Monthly Fees',
    href: '/dashboard/fees'
  },
  {
    id: 'table',
    label: 'Summary Table',
    href: '/dashboard/table'
  },
  {
    id: 'charts',
    label: 'Charts & Analysis',
    href: '/dashboard/charts'
  }
] as const

export default function StepNav() {
  const pathname = usePathname()
  const stepCompletion = useStepCompletion()
  
  return (
    <nav className="w-48 bg-white border-r border-stone-200 min-h-screen">
      <div className="p-6 space-y-3">
        {steps.map((step) => {
          const isCompleted = stepCompletion[step.id as keyof typeof stepCompletion]
          const isActive = pathname === step.href
          const isDisabled = getStepDisabled(step.id, stepCompletion)
          
          return (
            <Link
              key={step.id}
              href={isDisabled ? '#' : step.href}
              className={`
                block w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive 
                  ? 'bg-stone-900 text-white' 
                  : isCompleted
                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : isDisabled
                  ? 'bg-stone-50 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                }
              `}
              onClick={isDisabled ? (e) => e.preventDefault() : undefined}
            >
              {step.label}
            </Link>
          )
        })}
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