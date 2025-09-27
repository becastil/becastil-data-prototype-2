'use client'

import { useStepCompletion, useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import FinancialSummaryTable from '@/components/table/FinancialSummaryTable'
import DataTable, { Column } from '@/components/ui/DataTable'
import FocusWrapper from '@/components/focus/FocusWrapper'
import AppShell from '@/components/layout/AppShell'
import PremiumCard from '@/components/ui/PremiumCard'
import { useFocusMode } from '@/components/focus/FocusProvider'
import Link from 'next/link'

export default function TablePage() {
  const stepCompletion = useStepCompletion()
  const { isFocusMode } = useFocusMode()
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()
  
  if (!stepCompletion.table) {
    return (
      <FocusWrapper step={3} title="Summary Table">
        <AppShell currentStep={3}>
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
              Please complete the data upload and fees form before viewing the summary table.
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

  // Prepare high-cost claimants data for the new DataTable
  const highCostColumns: Column[] = [
    {
      key: 'memberId',
      title: 'Member ID',
      sortable: true,
      filterable: true,
      width: '120px'
    },
    {
      key: 'memberType',
      title: 'Type',
      sortable: true,
      filterable: true,
      width: '100px'
    },
    {
      key: 'ageBand',
      title: 'Age Band',
      sortable: true,
      filterable: true,
      width: '100px'
    },
    {
      key: 'primaryDiagnosisCategory',
      title: 'Primary Diagnosis',
      sortable: true,
      filterable: true,
      width: '200px'
    },
    {
      key: 'total',
      title: 'Total Cost',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => 
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(value || 0)
    },
    {
      key: 'percentPlanPaid',
      title: '% Plan Paid',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => `${(value || 0).toFixed(1)}%`
    },
    {
      key: 'hitStopLoss',
      title: 'Stop Loss',
      sortable: true,
      filterable: true,
      align: 'center' as const,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Y' 
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {value === 'Y' ? 'Yes' : 'No'}
        </span>
      )
    }
  ]

  // Create right panel content with data insights
  const rightPanelContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">
          Data Insights
        </h3>
        <div className="text-sm text-gray-600 mb-6">
          Summary statistics and key metrics
        </div>
      </div>

      <PremiumCard variant="glow" className="p-4">
        <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
          High-Cost Claimants
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Members</span>
            <span className="text-sm font-medium text-black">{highCostClaimants.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Stop Loss Hits</span>
            <span className="text-sm font-medium text-black">
              {highCostClaimants.filter(c => c.hitStopLoss === 'Y').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Cost</span>
            <span className="text-sm font-medium text-black">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
              }).format(highCostClaimants.reduce((sum, c) => sum + (c.total || 0), 0))}
            </span>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard variant="default" className="p-4">
        <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
          Experience Data
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Records</span>
            <span className="text-sm font-medium text-black">{experience.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Unique Months</span>
            <span className="text-sm font-medium text-black">
              {new Set(experience.map(e => e.month)).size}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Categories</span>
            <span className="text-sm font-medium text-black">
              {new Set(experience.map(e => e.category)).size}
            </span>
          </div>
        </div>
      </PremiumCard>
    </div>
  )
  
  return (
    <FocusWrapper step={3} title="Summary Table">
      <AppShell currentStep={3} rightPanel={rightPanelContent}>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-black">Summary Table</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive data view with filtering and sorting capabilities
            </p>
          </div>

          {/* Financial Summary */}
          <PremiumCard variant="glass" className="p-6">
            <h2 className="text-xl font-semibold text-black mb-6">Financial Summary</h2>
            <FinancialSummaryTable />
          </PremiumCard>

          {/* High-Cost Claimants Table */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-black">High-Cost Claimants</h2>
            <DataTable
              data={highCostClaimants}
              columns={highCostColumns}
              searchPlaceholder="Search claimants..."
              pagination={{ pageSize: 15 }}
              className="overflow-hidden"
            />
          </div>

          {/* Continue Button */}
          <div className="sticky bottom-0 bg-[var(--background)]/80 backdrop-blur-lg border-t border-black/6 p-6 -mx-8">
            <Link
              href="/dashboard/charts"
              className="btn-premium btn-premium--primary w-full justify-center"
            >
              Continue to Charts
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </AppShell>
    </FocusWrapper>
  )
}
