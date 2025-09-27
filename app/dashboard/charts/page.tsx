'use client'

import { useRouter } from 'next/navigation'
import { useStepCompletion } from '@/lib/store/useAppStore'
import ChartsGrid from '@/components/charts/ChartsGrid'
import FocusWrapper from '@/components/focus/FocusWrapper'
import { useFocusMode } from '@/components/focus/FocusProvider'
import InfoTooltip from '@/components/ui/InfoTooltip'
import Link from 'next/link'

export default function ChartsPage() {
  const router = useRouter()
  const stepCompletion = useStepCompletion()
  const { isFocusMode } = useFocusMode()
  const chartInsightsSections = [
    {
      content: (
        <ul className="list-disc space-y-1 pl-4">
          <li>Watch for months where actual spend exceeds budget to flag overruns.</li>
          <li>Hover the combo chart to see medical, Rx, admin, and adjustments behind each month.</li>
          <li>Review high-cost member bands to spot clusters and set program thresholds.</li>
        </ul>
      ),
    },
  ]
  
  const handleExportPDF = () => {
    router.push('/dashboard/print')
  }
  
  if (!stepCompletion.charts) {
    return (
      <FocusWrapper step={4} title="Charts">
        <div className={`${isFocusMode ? '' : 'min-h-screen '}bg-white text-black`}>
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-black/20 bg-white">
                <svg className="h-8 w-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-black">
                Previous Steps Required
              </h2>
              <p className="mb-6 text-sm text-black/70">
                Please complete the data upload and fees form before viewing charts and analytics.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
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
      </FocusWrapper>
    )
  }
  
  return (
    <FocusWrapper step={4} title="Charts">
      <div className={`${isFocusMode ? '' : 'min-h-screen '}bg-white text-black`}>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-black">Charts</h1>
              <InfoTooltip label="Key insights" sections={chartInsightsSections} />
            </div>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 rounded-md border border-black px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Export PDF Report
            </button>
          </div>

          <ChartsGrid />

          {!isFocusMode && (
            <div className="mt-12 flex items-center justify-between">
              <Link
                href="/dashboard/table"
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Summary Table
              </Link>
            </div>
          )}
        </div>
      </div>
    </FocusWrapper>
  )
}
