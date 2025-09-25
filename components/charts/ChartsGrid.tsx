'use client'

import { useExperienceData, useFinancialMetrics, useHighCostClaimants } from '@/lib/store/useAppStore'
import { getClaimantAmountBands } from '@/lib/calc/aggregations'
import { MonthlyActualBudgetChart } from './MonthlyActualBudgetChart'
import { HighCostBandsChart } from './HighCostBandsChart'

interface ChartsGridProps {
  className?: string
}

export default function ChartsGrid({ className = '' }: ChartsGridProps) {
  const experience = useExperienceData()
  const financialMetrics = useFinancialMetrics()
  const highCostClaimants = useHighCostClaimants()

  const budgetTotalsByMonth = new Map<string, number>()
  experience.forEach(row => {
    const normalizedCategory = row.category.trim().toLowerCase()
    if (normalizedCategory.includes('budget') && normalizedCategory.includes('x ee')) {
      budgetTotalsByMonth.set(row.month, row.amount)
    }
  })

  const actualVsBudgetData = financialMetrics.map(metric => {
    const [year, month] = metric.month.split('-')
    const monthLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })

    const budgetTotal = budgetTotalsByMonth.get(metric.month) ?? metric.monthlyBudget

    return {
      month: monthLabel,
      rawMonth: metric.month,
      actualTotal: metric.monthlyClaimsAndExpenses,
      budget: budgetTotal,
      medicalClaims: metric.totalMedicalClaims,
      rxClaims: metric.totalRxClaims,
      adminFees: metric.totalAdminFees,
      adjustments: (metric.rxRebates ?? 0) + (metric.stopLossReimbursement ?? 0),
      variance: metric.monthlyClaimsAndExpenses - budgetTotal,
      eeCount: metric.eeCount,
    }
  })

  const amountBands = getClaimantAmountBands(highCostClaimants)
  
  if (experience.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div className="w-16 h-16 bg-[#f3ede2] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#9b9287]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[#2f2a24] mb-2">
          No Data Available
        </h3>
        <p className="text-[#5b5247]">
          Complete the previous steps to view charts and analytics.
        </p>
      </div>
    )
  }
  
  return (
    <div className={`space-y-8 ${className}`}>
      <div className="bg-[#fdf9f2] rounded-2xl shadow-sm border border-[#eadfce] p-6">
        <div className="mb-4 flex flex-col gap-2">
          <h3 className="text-lg font-medium text-[#2f2a24]">
            Actual Claims &amp; Expenses vs Budget
          </h3>
          <p className="text-sm text-[#5b5247]">
            Bars show combined claims and administrative spend each month. The line overlays the
            2025-2026 PEPM budget multiplied by enrolled employees so you can spot months running above plan.
          </p>
        </div>
        <MonthlyActualBudgetChart data={actualVsBudgetData} height={400} />
      </div>

      <div className="bg-[#fdf9f2] rounded-2xl shadow-sm border border-[#eadfce] p-6">
        <div className="mb-4 flex flex-col gap-2">
          <h3 className="text-lg font-medium text-[#2f2a24]">
            High-Cost Claimants by Paid Amount Band
          </h3>
          <p className="text-sm text-[#5b5247]">
            Each bar shows how many high-cost members fall within the paid-amount band. Tooltip details include
            the total paid across the band and its share of the cohort.
          </p>
        </div>
        <HighCostBandsChart data={amountBands} height={360} />
      </div>

      {highCostClaimants.length === 0 && (
        <div className="rounded-2xl border border-[#eadfce] bg-white/60 p-6 text-center text-sm text-[#5b5247]">
          Upload a high-cost claimant file to populate the banded overview.
        </div>
      )}
    </div>
  )
}
