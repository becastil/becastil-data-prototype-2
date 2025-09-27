'use client'

import { useStepCompletion, useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import FinancialSummaryTable from '@/components/table/FinancialSummaryTable'
import DataTable, { Column } from '@/components/ui/DataTable'
import FocusWrapper from '@/components/focus/FocusWrapper'
import SubStepWrapper from '@/components/focus/SubStepWrapper'
import PremiumCard from '@/components/ui/PremiumCard'

export default function TablePage() {
  const stepCompletion = useStepCompletion()
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()
  
  if (!stepCompletion.table) {
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
            Please complete the data upload and fees form before viewing the summary table.
          </p>
        </div>
      </FocusWrapper>
    )
  }

  // High-cost claimants table columns
  const highCostColumns: Column<typeof highCostClaimants[0]>[] = [
    { 
      header: 'Member ID', 
      accessor: 'memberId' as keyof typeof highCostClaimants[0],
      width: '120px'
    },
    { 
      header: 'Total Claims', 
      accessor: 'total' as keyof typeof highCostClaimants[0],
      width: '130px',
      format: (value) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value as number)
    },
    { 
      header: 'Plan %', 
      accessor: 'percentPlanPaid' as keyof typeof highCostClaimants[0],
      width: '100px',
      format: (value) => `${value}%`
    },
    { 
      header: 'Stop Loss', 
      accessor: 'hitStopLoss' as keyof typeof highCostClaimants[0],
      width: '100px',
      format: (value) => value === 'Y' ? 'Yes' : 'No'
    },
    { 
      header: 'Enrolled', 
      accessor: 'enrolledAtTimeOfClaim' as keyof typeof highCostClaimants[0],
      width: '100px',
      format: (value) => value === 'Y' ? 'Yes' : 'No'
    }
  ]

  return (
    <FocusWrapper>
      <SubStepWrapper
        subStep={0}
        title="Financial Summary Table"
        description="Comprehensive view of your healthcare financial data"
      >
        <div className="space-y-8">
          {/* Financial Summary */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Financial Summary</h3>
            <FinancialSummaryTable />
          </div>

          {/* High-Cost Claimants Table */}
          {highCostClaimants.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">
                High-Cost Claimants
                <span className="ml-2 text-sm text-gray-600 font-normal">
                  ({highCostClaimants.length} members)
                </span>
              </h3>
              <PremiumCard variant="default" className="p-0 overflow-hidden">
                <DataTable 
                  data={highCostClaimants}
                  columns={highCostColumns}
                  className="max-h-96"
                />
              </PremiumCard>
            </div>
          )}

          {/* Data Summary Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <PremiumCard variant="default" className="p-6">
              <h4 className="font-medium text-black mb-2">Experience Records</h4>
              <div className="text-2xl font-bold text-black">{experience.length}</div>
              <div className="text-sm text-gray-600">Data points loaded</div>
            </PremiumCard>
            
            <PremiumCard variant="default" className="p-6">
              <h4 className="font-medium text-black mb-2">Time Period</h4>
              <div className="text-2xl font-bold text-black">
                {new Set(experience.map(e => e.month)).size}
              </div>
              <div className="text-sm text-gray-600">Months of data</div>
            </PremiumCard>
            
            <PremiumCard variant="default" className="p-6">
              <h4 className="font-medium text-black mb-2">Stop Loss Hits</h4>
              <div className="text-2xl font-bold text-black">
                {highCostClaimants.filter(c => c.hitStopLoss === 'Y').length}
              </div>
              <div className="text-sm text-gray-600">High-cost members</div>
            </PremiumCard>
          </div>
        </div>
      </SubStepWrapper>
    </FocusWrapper>
  )
}