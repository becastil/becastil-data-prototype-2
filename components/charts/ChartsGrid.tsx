'use client'

import { useEffect, useMemo, useState } from 'react'
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
      budgetTotalsByMonth.set(row.month, (budgetTotalsByMonth.get(row.month) ?? 0) + row.amount)
    }
  })

  const actualVsBudgetData = useMemo(() => financialMetrics.map(metric => {
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
  }), [financialMetrics, budgetTotalsByMonth])

  const monthRange = useMemo(() => actualVsBudgetData.map(d => d.rawMonth).sort(), [actualVsBudgetData])

  const [startMonth, setStartMonth] = useState<string>('')
  const [endMonth, setEndMonth] = useState<string>('')

  useEffect(() => {
    if (monthRange.length === 0) {
      setStartMonth('')
      setEndMonth('')
      return
    }
    setStartMonth(prev => (prev && monthRange.includes(prev) ? prev : monthRange[0]))
    setEndMonth(prev => (prev && monthRange.includes(prev) ? prev : monthRange[monthRange.length - 1]))
  }, [monthRange])

  const filteredActualData = useMemo(() => {
    if (!startMonth || !endMonth) return actualVsBudgetData
    const [start, end] = startMonth <= endMonth ? [startMonth, endMonth] : [endMonth, startMonth]
    return actualVsBudgetData.filter(item => item.rawMonth >= start && item.rawMonth <= end)
  }, [actualVsBudgetData, startMonth, endMonth])

  const amountBands = getClaimantAmountBands(highCostClaimants)
  
  if (experience.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-black/20">
          <svg className="w-8 h-8 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-black mb-2">
          No Data Available
        </h3>
        <p className="text-sm text-black/70">
          Complete the previous steps to view charts and analytics.
        </p>
      </div>
    )
  }
  
  return (
    <div className={`space-y-8 ${className}`}>
      <div className="rounded-xl border border-black/10 bg-white p-6">
        {monthRange.length > 1 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-black/70">
            <label className="flex items-center gap-2">
              <span>From</span>
              <select
                value={startMonth}
                onChange={event => setStartMonth(event.target.value)}
                className="rounded-md border border-black/30 bg-white px-2 py-1 text-sm text-black"
              >
                {monthRange.map(month => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span>To</span>
              <select
                value={endMonth}
                onChange={event => setEndMonth(event.target.value)}
                className="rounded-md border border-black/30 bg-white px-2 py-1 text-sm text-black"
              >
                {monthRange.map(month => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="mb-4 flex flex-col gap-2">
          <h3 className="text-lg font-medium text-black">
            Actual Claims &amp; Expenses vs Budget
          </h3>
          <p className="text-sm text-black/70">
            Bars show combined claims and administrative spend each month. The line overlays the 2025-2026
            PEPM budget multiplied by enrolled employees so you can spot months running above plan.
          </p>
        </div>
        <MonthlyActualBudgetChart data={filteredActualData} height={400} />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-6">
        <div className="mb-4 flex flex-col gap-2">
          <h3 className="text-lg font-medium text-black">
            High-Cost Claimants by Paid Amount Band
          </h3>
          <p className="text-sm text-black/70">
            Each bar shows how many high-cost members fall within the paid-amount band. Tooltip details include the
            total paid across the band and its share of the cohort.
          </p>
        </div>
        <HighCostBandsChart data={amountBands} height={360} />
      </div>

      {highCostClaimants.length === 0 && (
        <div className="rounded-xl border border-black/10 bg-white p-6 text-center text-sm text-black/70">
          Upload a high-cost claimant file to populate the banded overview.
        </div>
      )}
    </div>
  )
}
