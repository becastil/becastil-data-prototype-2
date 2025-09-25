'use client'

import { useRouter } from 'next/navigation'
import { useStepCompletion } from '@/lib/store/useAppStore'
import ChartsGrid from '@/components/charts/ChartsGrid'
import Link from 'next/link'

export default function ChartsPage() {
  const router = useRouter()
  const stepCompletion = useStepCompletion()
  
  const handleExportPDF = () => {
    router.push('/dashboard/print')
  }
  
  if (!stepCompletion.charts) {
    return (
      <div className="min-h-screen bg-[#f6f1e7] text-[#2f2a24]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full border border-[#eadfce] bg-white flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#2f2a24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#2f2a24] mb-2">
              Previous Steps Required
            </h2>
            <p className="text-[#4f463b] mb-6">
              Please complete the data upload and fees form before viewing charts and analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!stepCompletion.upload && (
                <Link 
                  href="/dashboard/upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2f2a24] font-medium rounded-lg border border-[#eadfce] hover:!bg-[#ede3d1] transition-colors"
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2f2a24] font-medium rounded-lg border border-[#eadfce] hover:!bg-[#ede3d1] transition-colors"
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
    <div className="min-h-screen bg-[#f6f1e7] text-[#2f2a24]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2f2a24] mb-2">
              Step 4: Charts & Analysis
            </h1>
            <p className="text-lg text-[#4f463b] max-w-3xl">
              Interactive charts and analytics showing your claims patterns, loss ratios, 
              and key performance indicators.
            </p>
          </div>
          
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2f6d55] text-white font-medium rounded-lg border border-transparent hover:!bg-[#275746] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Export PDF Report
          </button>
        </div>

        {/* Charts Grid */}
        <ChartsGrid />

        {/* Actions */}
        <div className="flex items-center justify-between mt-12">
          <Link 
            href="/dashboard/table"
            className="inline-flex items-center gap-2 px-4 py-2 text-[#2f2a24] hover:!bg-[#ede3d1] transition-colors rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Summary Table
          </Link>
          
          <div className="text-sm text-[#5b5247]">
            Analysis complete! Export your PDF report when ready.
          </div>
        </div>

        {/* Insights Summary */}
        <div className="mt-8 bg-[#fdf9f2] border border-[#eadfce] rounded-2xl p-6">
          <h3 className="text-lg font-medium text-[#2f2a24] mb-3">
            Key Insights
          </h3>
          <div className="text-sm text-[#4f463b] space-y-2">
            <p>• Review the stacked bar chart to identify seasonal patterns in claims by category</p>
            <p>• Monitor the loss ratio line - values above 100% indicate claims exceed premium revenue</p>
            <p>• Use the top categories chart to focus cost management efforts on highest-impact areas</p>
            <p>• Track high-cost claimants for case management opportunities</p>
          </div>
        </div>
      </div>
    </div>
  )
}
