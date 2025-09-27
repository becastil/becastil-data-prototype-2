'use client'

import { useRouter } from 'next/navigation'
import { useStepCompletion, useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import ChartsGrid from '@/components/charts/ChartsGrid'
import FocusWrapper from '@/components/focus/FocusWrapper'
import SubStepWrapper, { SubStepGroup } from '@/components/focus/SubStepWrapper'
import PremiumCard from '@/components/ui/PremiumCard'
import InfoTooltip from '@/components/ui/InfoTooltip'

export default function ChartsPage() {
  const router = useRouter()
  const stepCompletion = useStepCompletion()
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()

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
      <FocusWrapper>
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-black/20 bg-white">
            <svg className="h-8 w-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-black">
            Previous Steps Required
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            Please complete the data upload and fees form before viewing charts and analytics.
          </p>
        </div>
      </FocusWrapper>
    )
  }

  return (
    <FocusWrapper>
      <SubStepGroup>
        {/* Sub-step 0: Overview Charts */}
        <SubStepWrapper
          subStep={0}
          title="Overview Charts"
          description="Main financial charts and key metrics visualization"
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">Financial Overview</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Interactive charts showing your healthcare financial data
                </p>
              </div>
              <div className="flex items-center gap-3">
                <InfoTooltip label="Chart insights and tips" sections={chartInsightsSections} />
                <button
                  onClick={handleExportPDF}
                  className="btn-premium btn-premium--secondary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Export PDF Report
                </button>
              </div>
            </div>
            
            <ChartsGrid />
          </div>
        </SubStepWrapper>

        {/* Sub-step 1: Trends Analysis */}
        <SubStepWrapper
          subStep={1}
          title="Trend Analysis"
          description="Advanced trend analysis and forecasting insights"
        >
          <PremiumCard variant="glass" className="p-8 text-center">
            <h3 className="text-xl font-semibold text-black mb-4">Trends Analysis</h3>
            <p className="text-gray-600 mb-6">Advanced trend analysis and forecasting coming soon</p>
            <div className="w-16 h-16 mx-auto mb-4 opacity-30">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </PremiumCard>
        </SubStepWrapper>

        {/* Sub-step 2: Cost Breakdown */}
        <SubStepWrapper
          subStep={2}
          title="Cost Breakdown"
          description="Detailed cost analysis and category breakdown"
        >
          <PremiumCard variant="glass" className="p-8 text-center">
            <h3 className="text-xl font-semibold text-black mb-4">Cost Breakdown</h3>
            <p className="text-gray-600 mb-6">Detailed cost analysis and category breakdown coming soon</p>
            <div className="w-16 h-16 mx-auto mb-4 opacity-30">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
            </div>
          </PremiumCard>
        </SubStepWrapper>

        {/* Sub-step 3: Key Insights */}
        <SubStepWrapper
          subStep={3}
          title="Key Insights"
          description="Important insights and recommendations based on your data"
        >
          <PremiumCard variant="glow" className="p-8">
            <h3 className="text-xl font-semibold text-black mb-6">Key Insights</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">High-Cost Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stop Loss Hits</span>
                    <span className="text-sm font-medium text-black">
                      {highCostClaimants.filter(c => c.hitStopLoss === 'Y').length} members
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Plan Coverage</span>
                    <span className="text-sm font-medium text-black">
                      {highCostClaimants.length > 0 
                        ? (highCostClaimants.reduce((sum, c) => sum + (c.percentPlanPaid || 0), 0) / highCostClaimants.length).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Impact</span>
                    <span className="text-sm font-medium text-black">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0
                      }).format(highCostClaimants.reduce((sum, c) => sum + (c.total || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Experience Trends</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Data Points</span>
                    <span className="text-sm font-medium text-black">{experience.length} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Time Range</span>
                    <span className="text-sm font-medium text-black">
                      {new Set(experience.map(e => e.month)).size} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Categories</span>
                    <span className="text-sm font-medium text-black">
                      {new Set(experience.map(e => e.category)).size} types
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </PremiumCard>
        </SubStepWrapper>
      </SubStepGroup>
    </FocusWrapper>
  )
}