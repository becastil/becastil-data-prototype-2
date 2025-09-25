'use client'

import Link from 'next/link'
import DynamicFeeForm from '@/components/fees/DynamicFeeForm'
import BudgetForm from '@/components/fees/BudgetForm'
import MonthlyAdjustmentsForm from '@/components/fees/MonthlyAdjustmentsForm'
import {
  useBudgetByMonth,
  useBudgetMonths,
  useFeeDefinitions,
  useMonths,
  useStepCompletion,
} from '@/lib/store/useAppStore'

export default function FeesPage() {
  const stepCompletion = useStepCompletion()
  const months = useMonths()
  const feeDefinitions = useFeeDefinitions()
  const budgetByMonth = useBudgetByMonth()
  const budgetMonths = useBudgetMonths()
  const canContinue = stepCompletion.fees

  const hasBudgetCoverage = budgetMonths.length > 0 && budgetMonths.every(month => {
    const entry = budgetByMonth[month]
    return entry && (typeof entry.total === 'number' || typeof entry.pepm === 'number')
  })

  if (!stepCompletion.upload) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-white">
              <svg className="h-8 w-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-black">Upload Required</h2>
            <p className="mb-6 text-black">
              Please upload your experience data first before configuring monthly fees.
            </p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 rounded-lg border border-black px-6 py-3 font-medium text-black transition-colors hover:bg-black/5"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-black">Step 2: Monthly Fees</h1>
          <p className="mx-auto max-w-3xl text-lg text-black/80">
            Configure every administrative fee, choose the rate basis, and let the dashboard compute monthly totals using the headcounts from your experience file.
          </p>
        </div>

        <DynamicFeeForm />

        <BudgetForm />

        <MonthlyAdjustmentsForm />

        <div className="mt-8 flex items-start justify-between gap-4">
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-black transition-colors hover:bg-black/5"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Upload
          </Link>

          {canContinue ? (
            <Link
              href="/dashboard/table"
              className="inline-flex items-center gap-3 rounded-full bg-black px-6 py-3 font-medium text-white shadow hover:bg-black/80 transition"
            >
              Continue to Summary Table
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-3 rounded-full bg-black/10 px-6 py-3 font-medium text-black/40"
              >
                Continue to Summary Table
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="max-w-sm rounded-lg border border-black/10 bg-white p-3 text-sm text-black/70">
                {feeDefinitions.length === 0
                  ? 'Add at least one fee definition to unlock the summary table.'
                  : months.length === 0
                  ? 'Upload headcount data for at least one month to compute fees and budgets.'
                  : !hasBudgetCoverage
                  ? 'Enter budget PEPM or totals for every month in the schedule.'
                  : 'Review the fee schedule, budgets, and adjustments above. Add overrides where needed to complete this step.'}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-black/10 bg-white p-6">
          <h3 className="mb-3 text-lg font-medium text-black">Modeling Tips</h3>
          <div className="grid gap-4 text-sm text-black md:grid-cols-2">
            <div>
              <h4 className="font-semibold">Rate Basis Guidance</h4>
              <p>• Flat monthly: enter the invoice amount as-is.</p>
              <p>• PEPM / PMPM: enter the rate; the dashboard multiplies by the EE or member counts in your upload.</p>
              <p>• Annual: enter the annual total; it is allocated evenly across the months in your schedule.</p>
              <p>• Custom: enter monthly overrides directly in the schedule.</p>
            </div>
            <div>
              <h4 className="font-semibold">Best Practices</h4>
              <p>• Enter credits (rebates, reimbursements) as negative values so totals stay additive.</p>
              <p>• Track PEPM fees with both rate and invoice to monitor variances.</p>
              <p>• Use custom overrides when a month deviates from the standard pattern.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
