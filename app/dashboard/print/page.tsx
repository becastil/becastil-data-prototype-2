'use client'

import { useEffect } from 'react'
import { useStepCompletion } from '@/lib/store/useAppStore'
import PrintContainer from '@/components/print/PrintContainer'
import Link from 'next/link'

export default function PrintPage() {
  const stepCompletion = useStepCompletion()
  
  // Auto-trigger print dialog when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stepCompletion.table && typeof window !== 'undefined') {
        window.print()
      }
    }, 1000) // Small delay to ensure content is rendered
    
    return () => clearTimeout(timer)
  }, [stepCompletion.table])
  
  if (!stepCompletion.table) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full border border-black/10 bg-white flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">
              Data Required
            </h2>
            <p className="text-black mb-6">
              Please complete all previous steps before generating the PDF report.
            </p>
            <Link 
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg border border-black hover:bg-black/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="text-black">
      {/* Screen-only controls */}
      <div className="print:hidden bg-white p-4 text-center border-b border-black/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/dashboard/charts"
            className="inline-flex items-center gap-2 px-4 py-2 text-black hover:bg-black/5 transition-colors rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Charts
          </Link>
          
          <div className="text-sm text-black text-left">
            <p className="font-medium mb-1">PDF Export Ready</p>
            <p>Use Ctrl+P (Cmd+P on Mac) or your browser's print function to save as PDF</p>
          </div>
          
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg border border-black hover:bg-black/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save PDF
          </button>
        </div>
      </div>
      
      {/* Print content */}
      <PrintContainer />
    </div>
  )
}
