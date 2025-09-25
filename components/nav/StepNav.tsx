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
    <nav className="w-48 bg-white border-r border-black/10 min-h-screen text-black">
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
                block w-full px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-150
                ${isActive 
                  ? 'border-black bg-white text-black'
                  : isCompleted
                  ? 'border-black/40 bg-white text-black'
                  : isDisabled
                  ? 'border-black/10 bg-white text-black/50 cursor-not-allowed'
                  : 'border-black/20 bg-white text-black hover:bg-black/5'
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
