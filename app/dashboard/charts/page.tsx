'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStepCompletion, useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import ChartsGrid from '@/components/charts/ChartsGrid'
import FocusWrapper from '@/components/focus/FocusWrapper'
import AppShell from '@/components/layout/AppShell'
import PremiumCard from '@/components/ui/PremiumCard'
import TabNavigation, { Tab } from '@/components/ui/TabNavigation'
import { useFocusMode } from '@/components/focus/FocusProvider'
import InfoTooltip from '@/components/ui/InfoTooltip'
import Link from 'next/link'

export default function ChartsPage() {
  const router = useRouter()
  const stepCompletion = useStepCompletion()
  const { isFocusMode } = useFocusMode()
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()
  const [activeTab, setActiveTab] = useState('overview')

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

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      id: 'breakdown',
      label: 'Cost Breakdown',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      badge: highCostClaimants.filter(c => c.hitStopLoss === 'Y').length
    }
  ]
  
  const handleExportPDF = () => {
    router.push('/dashboard/print')
  }
  
  if (!stepCompletion.charts) {
    return (
      <FocusWrapper step={4} title="Charts">
        <AppShell currentStep={4}>
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
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              {!stepCompletion.upload && (
                <Link
                  href="/dashboard/upload"
                  className="btn-premium btn-premium--secondary"
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
                  className="btn-premium btn-premium--secondary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Enter Fees
                </Link>
              )}
            </div>
          </div>
        </AppShell>
      </FocusWrapper>
    )
  }
  
  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ChartsGrid />
      case 'trends':
        return (
          <PremiumCard variant="glass" className="p-8 text-center">
            <h3 className="text-xl font-semibold text-black mb-4">Trends Analysis</h3>
            <p className="text-gray-600 mb-6">Advanced trend analysis and forecasting coming soon</p>
            <div className="w-16 h-16 mx-auto mb-4 opacity-30">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </PremiumCard>
        )
      case 'breakdown':
        return (
          <PremiumCard variant="glass" className="p-8 text-center">
            <h3 className="text-xl font-semibold text-black mb-4">Cost Breakdown</h3>
            <p className="text-gray-600 mb-6">Detailed cost analysis and category breakdown coming soon</p>
            <div className="w-16 h-16 mx-auto mb-4 opacity-30">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
            </div>
          </PremiumCard>
        )
      case 'insights':
        return (
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
        )
      default:
        return <ChartsGrid />
    }
  }

  // Create right panel content
  const rightPanelContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">
          Chart Controls
        </h3>
        <div className="text-sm text-gray-600 mb-6">
          Export and analysis options
        </div>
      </div>

      <PremiumCard variant="default" className="p-4">
        <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
          Export Options
        </h4>
        <div className="space-y-3">
          <button
            onClick={handleExportPDF}
            className="btn-premium btn-premium--secondary w-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Export PDF Report
          </button>
          
          <button className="btn-premium btn-premium--ghost w-full" disabled>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Excel
            <span className="text-xs text-gray-400">(Soon)</span>
          </button>
        </div>
      </PremiumCard>

      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
          Quick Insights
        </h4>
        <InfoTooltip label="Chart insights and tips" sections={chartInsightsSections} />
        <div className="mt-3 text-xs text-gray-500">
          Hover chart elements for detailed tooltips and interactive analysis
        </div>
      </div>
    </div>
  )

  return (
    <FocusWrapper step={4} title="Charts">
      <AppShell currentStep={4} rightPanel={rightPanelContent}>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Charts & Analytics</h1>
              <p className="text-gray-600 mt-2">
                Interactive visualizations and data insights
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="default"
            size="md"
          />

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {renderTabContent()}
          </div>
        </div>
      </AppShell>
    </FocusWrapper>
  )
}
