'use client'

import DynamicFeeForm from '@/components/fees/DynamicFeeForm'
import BudgetForm from '@/components/fees/BudgetForm'
import MonthlyAdjustmentsForm from '@/components/fees/MonthlyAdjustmentsForm'
import InfoTooltip from '@/components/ui/InfoTooltip'
import FocusWrapper from '@/components/focus/FocusWrapper'
import SubStepWrapper, { SubStepGroup } from '@/components/focus/SubStepWrapper'
import {
  useStepCompletion,
} from '@/lib/store/useAppStore'

export default function FeesPage() {
  const stepCompletion = useStepCompletion()

  const modelingTipSections = [
    {
      title: 'Rate Basis Guidance',
      content: (
        <ul className="list-disc space-y-1 pl-4">
          <li>Flat monthly: enter the invoice amount as-is.</li>
          <li>PEPM / PMPM: enter the rate; the dashboard multiplies by EE or member counts.</li>
          <li>Annual: enter the annual total; it allocates evenly across the schedule.</li>
          <li>Custom: enter monthly overrides directly in the schedule.</li>
        </ul>
      ),
    },
    {
      title: 'Best Practices',
      content: (
        <ul className="list-disc space-y-1 pl-4">
          <li>Enter credits (rebates, reimbursements) as negative values.</li>
          <li>Track PEPM fees with both rate and invoice to monitor variances.</li>
          <li>Use custom overrides when a month deviates from the standard pattern.</li>
        </ul>
      ),
    },
  ]

  if (!stepCompletion.upload) {
    return (
      <FocusWrapper>
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-white">
            <svg className="h-8 w-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-black">Upload Required</h2>
          <p className="mb-6 text-black">
            Please upload your experience data first before configuring monthly fees.
          </p>
        </div>
      </FocusWrapper>
    )
  }

  return (
    <FocusWrapper>
      <SubStepGroup>
        {/* Sub-step 0: Fee Schedule */}
        <SubStepWrapper
          subStep={0}
          title="Fee Schedule Configuration"
          description="Define your monthly fee structure and rates"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">Monthly Fee Definitions</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Configure fee rates, basis, and calculation methods
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-black/50">
                Modeling Tips
                <InfoTooltip label="Modeling tips" sections={modelingTipSections} />
              </div>
            </div>
            
            <DynamicFeeForm />
          </div>
        </SubStepWrapper>

        {/* Sub-step 1: Budget Schedule */}
        <SubStepWrapper
          subStep={1}
          title="Budget Schedule Setup"
          description="Set budget amounts and per-member rates for planning"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black">Budget Configuration</h3>
              <p className="text-gray-600 text-sm mt-1">
                Define your budget targets and PEPM rates for comparison with actual expenses
              </p>
            </div>
            
            <BudgetForm />
          </div>
        </SubStepWrapper>

        {/* Sub-step 2: Monthly Adjustments */}
        <SubStepWrapper
          subStep={2}
          title="Monthly Adjustments"
          description="Apply one-time adjustments and overrides for specific months"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black">One-Time Adjustments</h3>
              <p className="text-gray-600 text-sm mt-1">
                Add credits, rebates, or one-off adjustments that don't follow the regular fee schedule
              </p>
            </div>
            
            <MonthlyAdjustmentsForm />
          </div>
        </SubStepWrapper>
      </SubStepGroup>
    </FocusWrapper>
  )
}