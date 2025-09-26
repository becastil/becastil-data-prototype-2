'use client'

import { useEffect, useMemo, useState } from 'react'
import { useExperienceData, useFinancialMetrics, useHighCostClaimants, useSummaries } from '@/lib/store/useAppStore'
import { getClaimantAmountBands } from '@/lib/calc/aggregations'
import { MonthlyActualBudgetChart } from './MonthlyActualBudgetChart'
import { HighCostBandsChart } from './HighCostBandsChart'
import EnrollmentTrendChart from './EnrollmentTrendChart'
import LossGaugeCard from './LossGaugeCard'
import { LossRatioTrendChart } from './LossRatioTrendChart'
import { TopClaimantsChart } from './TopClaimantsChart'
import { CostBreakdownChart } from './CostBreakdownChart'

interface ChartsGridProps {
  className?: string
}

const cardBase =
  'rounded-2xl border border-[color:var(--surface-border)] bg-[var(--surface)]/95 px-6 py-5 shadow-[0_22px_60px_-40px_rgba(19,52,59,0.55)] flex flex-col gap-5 transition-colors duration-300'

export default function ChartsGrid({ className = '' }: ChartsGridProps) {
  const experience = useExperienceData()
  const financialMetrics = useFinancialMetrics()
  const highCostClaimants = useHighCostClaimants()
  const summaries = useSummaries()

  const budgetTotalsByMonth = useMemo(() => {
    const totals = new Map<string, number>()
    experience.forEach(row => {
      const normalizedCategory = row.category.trim().toLowerCase()
      if (normalizedCategory.includes('budget') && normalizedCategory.includes('x ee')) {
        totals.set(row.month, (totals.get(row.month) ?? 0) + row.amount)
      }
    })
    return totals
  }, [experience])

  const actualVsBudgetData = useMemo(
    () =>
      financialMetrics.map(metric => {
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
      }),
    [financialMetrics, budgetTotalsByMonth],
  )

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

  const fuelPercent = useMemo(() => {
    if (financialMetrics.length === 0) return null
    const latest = financialMetrics[financialMetrics.length - 1]
    if (!latest) return null

    if (typeof latest.cumulativeDifferencePct === 'number') {
      const ratio = (1 + latest.cumulativeDifferencePct) * 100
      return Number.isFinite(ratio) ? Math.round(ratio * 10) / 10 : null
    }

    if (latest.cumulativeBudget > 0) {
      const ratio = (latest.cumulativeClaimsAndExpenses / latest.cumulativeBudget) * 100
      return Number.isFinite(ratio) ? Math.round(ratio * 10) / 10 : null
    }

    return null
  }, [financialMetrics])

  const stopLossPercent = useMemo(() => {
    const totalClaims = summaries.reduce((sum, summary) => sum + summary.claims, 0)
    const stopLossRecovered = financialMetrics.reduce(
      (sum, metric) => sum + Math.abs(metric.stopLossReimbursement || 0),
      0,
    )
    const ratio = totalClaims > 0 ? (stopLossRecovered / totalClaims) * 100 : 0
    return Math.round(ratio * 10) / 10
  }, [summaries, financialMetrics])

  const topClaimantsData = useMemo(() => {
    if (highCostClaimants.length === 0) return []

    const totalClaims = highCostClaimants.reduce((sum, claimant) => sum + claimant.total, 0)

    return highCostClaimants
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(claimant => ({
        memberId: claimant.memberId,
        totalAmount: claimant.total,
        claimCount: 1,
        percentage: totalClaims > 0 ? (claimant.total / totalClaims) * 100 : 0,
      }))
  }, [highCostClaimants])

  const amountBands = getClaimantAmountBands(highCostClaimants)

  const lossRatioSummaries = useMemo(
    () =>
      summaries.map((summary, index) => ({
        month: summary.month || `Month ${index + 1}`,
        claims: summary.claims,
        premium: summary.premium,
        feesTotal: summary.feesTotal,
        totalCost: summary.totalCost,
        lossRatio: summary.lossRatio,
        r12LossRatio: summary.r12LossRatio,
      })),
    [summaries],
  )

  const enrollmentTrendData = useMemo(
    () =>
      filteredActualData.map(item => ({
        month: item.rawMonth,
        label: item.month,
        enrollment: item.eeCount,
      })),
    [filteredActualData],
  )

  if (experience.length === 0) {
    return (
      <div
        className={`flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-[color:var(--surface-border)] bg-[var(--surface)]/70 px-6 py-12 text-center text-[var(--foreground)]/60 ${className}`}
      >
        <svg className="h-12 w-12 text-[var(--foreground)]/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l3-3 4 4 5-6" />
        </svg>
        <p className="mt-4 text-base font-semibold">Charts unlock after data upload</p>
        <p className="mt-2 text-sm text-[var(--foreground)]/55">
          Complete the earlier steps to populate the dashboard visuals and analytics.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-12 ${className}`}>
      <section className="grid gap-6 xl:grid-cols-2">
        <div className={`${cardBase} xl:col-span-2`}>
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Monthly Actual vs Budget</h3>
              <p className="text-sm text-[var(--foreground)]/70">Compare actual claims and expenses against the planned budget.</p>
            </div>
            {monthRange.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground)]/70">
                <button
                  type="button"
                  onClick={() => {
                    const startIndex = Math.max(0, monthRange.length - 3)
                    setStartMonth(monthRange[startIndex])
                    setEndMonth(monthRange[monthRange.length - 1])
                  }}
                  className="rounded-full border border-[color:var(--surface-border)] bg-white/60 px-3 py-1 font-semibold uppercase tracking-[0.28em] text-[var(--foreground)] transition hover:bg-white"
                >
                  Last 3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const startIndex = Math.max(0, monthRange.length - 6)
                    setStartMonth(monthRange[startIndex])
                    setEndMonth(monthRange[monthRange.length - 1])
                  }}
                  className="rounded-full border border-[color:var(--surface-border)] bg-white/60 px-3 py-1 font-semibold uppercase tracking-[0.28em] text-[var(--foreground)] transition hover:bg-white"
                >
                  Last 6
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentYear = new Date().getFullYear().toString()
                    const ytdStart = monthRange.find(month => month.startsWith(currentYear)) || monthRange[0]
                    setStartMonth(ytdStart)
                    setEndMonth(monthRange[monthRange.length - 1])
                  }}
                  className="rounded-full border border-[color:var(--surface-border)] bg-white/60 px-3 py-1 font-semibold uppercase tracking-[0.28em] text-[var(--foreground)] transition hover:bg-white"
                >
                  YTD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartMonth(monthRange[0])
                    setEndMonth(monthRange[monthRange.length - 1])
                  }}
                  className="rounded-full border border-[color:var(--surface-border)] bg-white/60 px-3 py-1 font-semibold uppercase tracking-[0.28em] text-[var(--foreground)] transition hover:bg-white"
                >
                  All
                </button>
                <div className="ml-auto flex flex-wrap items-center gap-2 text-[var(--foreground)]/60">
                  <span>From</span>
                  <select
                    value={startMonth}
                    onChange={event => setStartMonth(event.target.value)}
                    className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)] px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[rgba(33,128,141,0.25)]"
                  >
                    {monthRange.map(month => (
                      <option key={month} value={month}>
                        {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                  <span>To</span>
                  <select
                    value={endMonth}
                    onChange={event => setEndMonth(event.target.value)}
                    className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)] px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[rgba(33,128,141,0.25)]"
                  >
                    {monthRange.map(month => (
                      <option key={month} value={month}>
                        {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <MonthlyActualBudgetChart data={filteredActualData} height={320} />
          </div>
        </div>

        <div className={cardBase}>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Loss Ratio Trend</h3>
            <p className="text-sm text-[var(--foreground)]/70">Twelve-month view with benchmarks at 80% and 100%.</p>
          </div>
          <div className="flex-1">
            <LossRatioTrendChart summaries={lossRatioSummaries} height={260} />
          </div>
        </div>

        <div className={`${cardBase} xl:col-span-2`}>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Cost Breakdown</h3>
            <p className="text-sm text-[var(--foreground)]/70">Distribution of spend across medical, pharmacy, administrative, and recoveries.</p>
          </div>
          <CostBreakdownChart financialMetrics={financialMetrics} height={340} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className={cardBase}>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Fuel Gauge</h3>
            <p className="text-sm text-[var(--foreground)]/70">Cumulative spend versus plan with stop-loss reference.</p>
          </div>
          <LossGaugeCard
            fuelPercent={fuelPercent}
            stopLossPercent={stopLossPercent}
            mode="fuel"
            onModeChange={() => {}}
            hideModeSwitcher
            className="flex-1"
          />
        </div>

        <div className={cardBase}>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Top High-Cost Claimants</h3>
            <p className="text-sm text-[var(--foreground)]/70">Leading members ranked by paid amount and share of cohort.</p>
          </div>
          <div className="flex-1">
            <TopClaimantsChart claimants={topClaimantsData} height={260} />
          </div>
        </div>

        <div className={cardBase}>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">High-Cost Claimants by Band</h3>
            <p className="text-sm text-[var(--foreground)]/70">Count of members grouped by paid-amount ranges.</p>
          </div>
          <div className="flex-1">
            <HighCostBandsChart data={amountBands} height={260} />
          </div>
        </div>

        <div className={`${cardBase} lg:col-span-2 xl:col-span-3`}>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Enrollment Trend</h3>
            <p className="text-sm text-[var(--foreground)]/70">Employee participation over the selected period.</p>
          </div>
          <div className="flex-1">
            <EnrollmentTrendChart data={enrollmentTrendData} height={240} />
          </div>
        </div>
      </section>
    </div>
  )
}
