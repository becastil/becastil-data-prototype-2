'use client'

import { useStepCompletion } from '@/lib/store/useAppStore'
import SummaryTable from '@/components/table/SummaryTable'
import Link from 'next/link'

export default function TablePage() {
  const stepCompletion = useStepCompletion()
  
  if (!stepCompletion.table) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-black/20 bg-white">
              <svg className="h-8 w-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-black">
              Previous Steps Required
            </h2>
            <p className="mb-6 text-sm text-black/70">
              Please complete the data upload and fees form before viewing the summary table.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!stepCompletion.upload && (
                <Link 
                  href="/dashboard/upload"
                  className="inline-flex items-center gap-2 rounded-md border border-black px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Data
                </Link>
              )}
              {stepCompletion.upload && !stepCompletion.fees && (
                <Link 
                  href="/dashboard/fees"
                  className="inline-flex items-center gap-2 rounded-md border border-black px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Enter Fees
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Step 3: Summary Table
          </h1>
          <p className="text-sm text-black/70 max-w-3xl mx-auto">
            Review the experience data by category and month. Export the complete report when ready.
          </p>
        </div>

        {/* Summary Table */}
        <SummaryTable />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard/fees"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Fees
          </Link>
          
          <Link 
            href="/dashboard/charts"
            className="inline-flex items-center gap-2 rounded-md border border-black px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white"
          >
            Continue to Charts
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
