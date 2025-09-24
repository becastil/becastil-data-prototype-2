'use client'

import { useState } from 'react'
import { useStepCompletion, useMonths } from '@/lib/store/useAppStore'
import FeesGrid from '@/components/fees/FeesGrid'
import Link from 'next/link'

export default function FeesPage() {
  const stepCompletion = useStepCompletion()
  const months = useMonths()
  const [validationState, setValidationState] = useState({ isValid: false, completedMonths: 0 })
  
  const handleDataChange = (isValid: boolean, completedMonths: number) => {
    setValidationState({ isValid, completedMonths })
  }
  
  if (!stepCompletion.upload) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Upload Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please upload your experience data first before entering monthly fees.
            </p>
            <Link 
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Go to Upload
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Step 2: Monthly Fees
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Enter the monthly administrative fees for each period in your data.
            These will be added to your claims costs to calculate total expenses and loss ratios.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress:</span>
              <span className={`font-medium ${
                validationState.isValid 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {validationState.completedMonths} of {months.length} months completed
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  validationState.isValid ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ 
                  width: `${months.length > 0 ? (validationState.completedMonths / months.length) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Fees Grid */}
        <div className="mb-8">
          <FeesGrid onDataChange={handleDataChange} />
        </div>

        {/* Status and Actions */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Upload
          </Link>
          
          {validationState.isValid && (
            <Link 
              href="/dashboard/table"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Summary Table
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
            Fee Categories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">TPA Fee</h4>
              <p>Third-party administrator fees for claims processing and member services</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Network Fee</h4>
              <p>Provider network access and discount fees</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Stop Loss Premium</h4>
              <p>Insurance premium for protection against high-cost claims</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Other Fees</h4>
              <p>Additional administrative costs, consulting fees, or other charges</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}