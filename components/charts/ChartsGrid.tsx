'use client'

import { useEffect, useMemo, useState } from 'react'
import { useExperienceData, useFinancialMetrics, useHighCostClaimants, useSummaries } from '@/lib/store/useAppStore'
import { getClaimantAmountBands } from '@/lib/calc/aggregations'
import { MonthlyActualBudgetChart } from './MonthlyActualBudgetChart'
import { HighCostBandsChart } from './HighCostBandsChart'
import EnrollmentTrendChart from './EnrollmentTrendChart'
import LossGaugeCard from './LossGaugeCard'
import { KPIDashboard } from './KPIDashboard'
import { LossRatioTrendChart } from './LossRatioTrendChart'
import { TopClaimantsChart } from './TopClaimantsChart'
import { CostBreakdownChart } from './CostBreakdownChart'

interface ChartsGridProps {
  className?: string
}

export default function ChartsGrid({ className = '' }: ChartsGridProps) {
  const experience = useExperienceData()
  const financialMetrics = useFinancialMetrics()
  const highCostClaimants = useHighCostClaimants()
  const summaries = useSummaries()

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

  const filteredEnrollmentData = useMemo(() =>
    filteredActualData.map(item => ({
      month: item.rawMonth,
      label: item.month,
      enrollment: item.eeCount,
    })),
  [filteredActualData])

  const { lossRatioPercent, stopLossPercent } = useMemo(() => {
    const totalClaims = summaries.reduce((sum, summary) => sum + summary.claims, 0)
    const totalPremium = summaries.reduce((sum, summary) => sum + summary.premium, 0)
    const lossRatio = totalPremium > 0 ? (totalClaims / totalPremium) * 100 : 0

    const stopLossRecovered = financialMetrics.reduce((sum, metric) => sum + Math.abs(metric.stopLossReimbursement || 0), 0)
    const stopLossRatio = totalClaims > 0 ? (stopLossRecovered / totalClaims) * 100 : 0

    return {
      lossRatioPercent: lossRatio,
      stopLossPercent: stopLossRatio,
    }
  }, [summaries, financialMetrics])

  const [gaugeMode, setGaugeMode] = useState<'loss' | 'stopLoss'>('loss')

  const lossRatioSummaries = useMemo(() => {
    return summaries.map((summary, index) => ({
      month: summary.month || `Month ${index + 1}`,
      claims: summary.claims,
      premium: summary.premium,
      feesTotal: 0,
      totalCost: summary.claims,
      lossRatio: summary.premium > 0 ? summary.claims / summary.premium : null,
      r12LossRatio: null, // Would need 12 months of data to calculate properly
    }))
  }, [summaries])

  const topClaimantsData = useMemo(() => {
    if (highCostClaimants.length === 0) return []
    
    const totalClaims = highCostClaimants.reduce((sum, claimant) => sum + claimant.total, 0)
    
    return highCostClaimants
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(claimant => ({
        memberId: claimant.memberId,
        totalAmount: claimant.total,
        claimCount: 1, // We don't have claim count data, so defaulting to 1
        percentage: totalClaims > 0 ? (claimant.total / totalClaims) * 100 : 0,
      }))
  }, [highCostClaimants])

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
      {/* KPI Dashboard */}
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-black mb-2">
            Key Performance Indicators
          </h3>
          <p className="text-sm text-black/70">
            Overview of critical metrics and year-to-date performance indicators.
          </p>
        </div>
        <KPIDashboard 
          financialMetrics={financialMetrics}
          summaries={summaries}
        />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-6">
        {monthRange.length > 1 && (
          <div className="mb-4 space-y-3">
            {/* Preset buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-black mr-2">Quick Select:</span>
              <button
                onClick={() => {
                  setStartMonth(monthRange[Math.max(0, monthRange.length - 3)])
                  setEndMonth(monthRange[monthRange.length - 1])
                }}
                className="rounded-full border border-black/30 px-3 py-1 text-xs font-medium text-black transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                Last 3 Months
              </button>
              <button
                onClick={() => {
                  setStartMonth(monthRange[Math.max(0, monthRange.length - 6)])
                  setEndMonth(monthRange[monthRange.length - 1])
                }}
                className="rounded-full border border-black/30 px-3 py-1 text-xs font-medium text-black transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                Last 6 Months
              </button>
              <button
                onClick={() => {
                  // YTD - find January of current year or first month if not available
                  const currentYear = new Date().getFullYear().toString()
                  const ytdStart = monthRange.find(month => month.startsWith(currentYear)) || monthRange[0]
                  setStartMonth(ytdStart)
                  setEndMonth(monthRange[monthRange.length - 1])
                }}
                className="rounded-full border border-black/30 px-3 py-1 text-xs font-medium text-black transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                YTD
              </button>
              <button
                onClick={() => {
                  setStartMonth(monthRange[0])
                  setEndMonth(monthRange[monthRange.length - 1])
                }}
                className="rounded-full border border-black/30 px-3 py-1 text-xs font-medium text-black transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                All Data
              </button>
            </div>
            
            {/* Manual selectors */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-black/70">
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
              <div className="text-xs text-black/50">
                Showing {filteredActualData.length} months of data
              </div>
            </div>
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

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-6">
          <div className="mb-4 flex flex-col gap-2">
            <h3 className="text-lg font-medium text-black">
              Enrollment Trend
            </h3>
            <p className="text-sm text-black/70">
              Track how many employees are enrolled over the selected period.
            </p>
          </div>
          <EnrollmentTrendChart data={filteredEnrollmentData} />
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-6">
          <LossGaugeCard
            lossRatioPercent={lossRatioPercent}
            stopLossPercent={stopLossPercent}
            mode={gaugeMode}
            onModeChange={setGaugeMode}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-6">
          <div className="mb-4 flex flex-col gap-2">
            <h3 className="text-lg font-medium text-black">
              Cost Breakdown Distribution
            </h3>
            <p className="text-sm text-black/70">
              Year-to-date spending distribution across medical, pharmacy, administrative costs, and stop-loss recoveries.
            </p>
          </div>
          <CostBreakdownChart financialMetrics={financialMetrics} />
        </div>
        
        <div className="rounded-xl border border-black/10 bg-white p-6">
          <div className="mb-4 flex flex-col gap-2">
            <h3 className="text-lg font-medium text-black">
              Monthly Variance Summary
            </h3>
            <p className="text-sm text-black/70">
              Quick overview of key month-to-month changes and trends in your metrics.
            </p>
          </div>
          <div className="space-y-4">
            {financialMetrics.length >= 2 && (
              <>
                {(() => {
                  const current = financialMetrics[financialMetrics.length - 1]
                  const previous = financialMetrics[financialMetrics.length - 2]
                  const costChange = current.monthlyClaimsAndExpenses - previous.monthlyClaimsAndExpenses
                  const costChangePercent = previous.monthlyClaimsAndExpenses > 0 
                    ? (costChange / previous.monthlyClaimsAndExpenses) * 100 
                    : 0
                  const enrollmentChange = current.eeCount - previous.eeCount
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-black/5 rounded-lg">
                        <span className="text-sm font-medium text-black">Monthly Cost Change</span>
                        <span className={`text-sm font-semibold tabular-nums ${
                          costChange > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {costChange > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(costChange)} ({costChangePercent > 0 ? '+' : ''}{costChangePercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-black/5 rounded-lg">
                        <span className="text-sm font-medium text-black">Enrollment Change</span>
                        <span className={`text-sm font-semibold tabular-nums ${
                          enrollmentChange > 0 ? 'text-green-600' : enrollmentChange < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {enrollmentChange > 0 ? '+' : ''}{enrollmentChange} employees
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-black/5 rounded-lg">
                        <span className="text-sm font-medium text-black">Latest Month</span>
                        <span className="text-sm font-semibold text-black tabular-nums">
                          {new Date(current.month + '-01').toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })()}
              </>
            )}
            {financialMetrics.length < 2 && (
              <div className="text-sm text-black/60 text-center py-8">
                Need at least 2 months of data to show variance analysis.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-2">
            <h3 className="text-lg font-medium text-black">
              Loss Ratio Trend Analysis
            </h3>
            <p className="text-sm text-black/70">
              Monthly and rolling 12-month loss ratios with break-even and target reference lines.
              Values above 100% indicate claims exceeding premium revenue.
            </p>
          </div>
          {lossRatioSummaries.length > 0 ? (
            <LossRatioTrendChart summaries={lossRatioSummaries} />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-black/60">
              No loss ratio data available for trend analysis.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-2">
            <h3 className="text-lg font-medium text-black">
              Top 10 High-Cost Claimants
            </h3>
            <p className="text-sm text-black/70">
              Individual members ranked by total claim amounts. Each bar represents a member's total cost impact and percentage of cohort spending.
            </p>
          </div>
          {topClaimantsData.length > 0 ? (
            <TopClaimantsChart claimants={topClaimantsData} />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-black/60">
              Upload high-cost claimant data to view top member analysis.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-2">
            <h3 className="text-lg font-medium text-black">
              High-Cost Claimants by Paid Amount Band
            </h3>
            <p className="text-sm text-black/70">
              Each bar shows how many high-cost members fall within the paid-amount band. Tooltip details include the
              total paid across the band and its share of the cohort.
            </p>
          </div>
          <HighCostBandsChart data={amountBands} height={320} />
          {highCostClaimants.length === 0 && (
            <div className="mt-4 rounded-lg border border-black/10 bg-white p-4 text-center text-sm text-black/70">
              Upload a high-cost claimant file to populate the banded overview.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
