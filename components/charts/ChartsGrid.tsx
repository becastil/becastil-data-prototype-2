'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  useAppStore,
  useDashboardFilters,
  useDashboardFocus,
  useExperienceData,
  useFinancialMetrics,
  useHighCostClaimants,
  useSummaries,
} from '@/lib/store/useAppStore'
import { getClaimantAmountBands, type ClaimantAmountBand } from '@/lib/calc/aggregations'
import SurfaceCard from '@/components/ui/SurfaceCard'
import { MonthlyActualBudgetChart } from './MonthlyActualBudgetChart'
import { HighCostBandsChart } from './HighCostBandsChart'
import EnrollmentTrendChart from './EnrollmentTrendChart'
import LossGaugeCard from './LossGaugeCard'
import { LossRatioTrendChart } from './LossRatioTrendChart'
import { TopClaimantsChart } from './TopClaimantsChart'
import { CostBreakdownChart } from './CostBreakdownChart'
import type { TopClaimant } from '@/lib/schemas/fees'

interface ChartsGridProps {
  className?: string
}

export default function ChartsGrid({ className = '' }: ChartsGridProps) {
  const experience = useExperienceData()
  const financialMetrics = useFinancialMetrics()
  const highCostClaimants = useHighCostClaimants()
  const summaries = useSummaries()
  const dashboardFilters = useDashboardFilters()
  const dashboardFocus = useDashboardFocus()
  const { updateDashboardFilters, setDashboardFocus } = useAppStore()

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

  const formatMonthShort = useCallback(
    (month: string) =>
      new Date(month + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    [],
  )

  useEffect(() => {
    if (monthRange.length === 0) return
    const currentStart = dashboardFilters.startMonth
    const currentEnd = dashboardFilters.endMonth
    const fallbackStart = currentStart && monthRange.includes(currentStart) ? currentStart : monthRange[0]
    const fallbackEnd = currentEnd && monthRange.includes(currentEnd) ? currentEnd : monthRange[monthRange.length - 1]
    if (fallbackStart > fallbackEnd) {
      const ordered = [fallbackStart, fallbackEnd].sort()
      updateDashboardFilters({ startMonth: ordered[0], endMonth: ordered[1] })
      return
    }
    if (fallbackStart !== currentStart || fallbackEnd !== currentEnd) {
      updateDashboardFilters({ startMonth: fallbackStart, endMonth: fallbackEnd })
    }
  }, [monthRange, dashboardFilters.startMonth, dashboardFilters.endMonth, updateDashboardFilters])

  const startMonth = dashboardFilters.startMonth && monthRange.includes(dashboardFilters.startMonth)
    ? dashboardFilters.startMonth
    : monthRange[0]
  const endMonth = dashboardFilters.endMonth && monthRange.includes(dashboardFilters.endMonth)
    ? dashboardFilters.endMonth
    : monthRange[monthRange.length - 1]

  const handleRangeUpdate = (nextStart: string, nextEnd: string) => {
    if (!nextStart || !nextEnd) return
    if (nextStart === startMonth && nextEnd === endMonth) return
    updateDashboardFilters({ startMonth: nextStart, endMonth: nextEnd })
  }

  const handleMonthSelect = (month: string) => {
    handleRangeUpdate(month, month)
    setDashboardFocus({
      month,
      band: dashboardFocus.band,
      claimantId: dashboardFocus.claimantId,
      category: dashboardFocus.category,
    })
  }

  const handleMonthFocus = (month: string | null) => {
    setDashboardFocus({
      month,
      band: dashboardFocus.band,
      claimantId: dashboardFocus.claimantId,
      category: dashboardFocus.category,
    })
  }

  const handleBandFocus = (label: string | null) => {
    setDashboardFocus({
      month: dashboardFocus.month,
      band: label,
      claimantId: dashboardFocus.claimantId,
      category: dashboardFocus.category,
    })
  }

  const handleBandSelect = (band: ClaimantAmountBand) => {
    const nextLabel = dashboardFilters.highCostBand === band.label ? null : band.label
    updateDashboardFilters({ highCostBand: nextLabel })
    setDashboardFocus({
      month: dashboardFocus.month,
      band: nextLabel,
      claimantId: dashboardFocus.claimantId,
      category: dashboardFocus.category,
    })
  }

  const handleClaimantFocus = (memberId: string | null) => {
    setDashboardFocus({
      month: dashboardFocus.month,
      band: dashboardFocus.band,
      claimantId: memberId,
      category: dashboardFocus.category,
    })
  }

  const handleClaimantSelect = (claimant: TopClaimant) => {
    const nextId = dashboardFilters.topClaimantId === claimant.memberId ? null : claimant.memberId
    updateDashboardFilters({ topClaimantId: nextId })
    setDashboardFocus({
      month: dashboardFocus.month,
      band: dashboardFocus.band,
      claimantId: nextId,
      category: dashboardFocus.category,
    })
  }

  const clearBandFilter = () => {
    updateDashboardFilters({ highCostBand: null })
    setDashboardFocus({
      month: dashboardFocus.month,
      band: null,
      claimantId: dashboardFocus.claimantId,
      category: dashboardFocus.category,
    })
  }

  const clearClaimantFilter = () => {
    updateDashboardFilters({ topClaimantId: null })
    setDashboardFocus({
      month: dashboardFocus.month,
      band: dashboardFocus.band,
      claimantId: null,
      category: dashboardFocus.category,
    })
  }

  const stopLossTargetPct = dashboardFilters.stopLossTargetPct

  const handleStopLossTargetChange = (value: number) => {
    if (Number.isNaN(value)) return
    const clamped = Math.min(Math.max(Math.round(value), 80), 150)
    if (clamped !== stopLossTargetPct) {
      updateDashboardFilters({ stopLossTargetPct: clamped })
    }
  }

  const monthlyChartRef = useRef<HTMLDivElement>(null)
  const bandsChartRef = useRef<HTMLDivElement>(null)
  const topClaimantsChartRef = useRef<HTMLDivElement>(null)

  const exportChartAsImage = async (element: HTMLDivElement | null, filename: string) => {
    if (!element) return
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(element, {
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--muted-background') || '#ffffff',
      scale: window.devicePixelRatio > 1 ? 2 : 1,
      useCORS: true,
    })
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${filename}.png`
    link.click()
  }

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

  const amountBands = useMemo(() => getClaimantAmountBands(highCostClaimants), [highCostClaimants])

  const topClaimantsData = useMemo(() => {
    if (highCostClaimants.length === 0) return []

    const filteredClaimants = (() => {
      if (!dashboardFilters.highCostBand) return highCostClaimants
      const band = amountBands.find(item => item.label === dashboardFilters.highCostBand)
      if (!band) return highCostClaimants
      return highCostClaimants.filter(
        claimant => claimant.total >= band.min && claimant.total < band.max,
      )
    })()

    if (filteredClaimants.length === 0) return []

    const totalClaims = filteredClaimants.reduce((sum, claimant) => sum + claimant.total, 0)

    return filteredClaimants
      .slice()
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(claimant => ({
        memberId: claimant.memberId,
        totalAmount: claimant.total,
        claimCount: 1,
        percentage: totalClaims > 0 ? (claimant.total / totalClaims) * 100 : 0,
      }))
  }, [highCostClaimants, amountBands, dashboardFilters.highCostBand])

  const activeBandLabel = dashboardFocus.band ?? dashboardFilters.highCostBand ?? null
  const activeClaimantId = dashboardFocus.claimantId ?? dashboardFilters.topClaimantId ?? null
  const isFullRange = monthRange.length > 0 && startMonth === monthRange[0] && endMonth === monthRange[monthRange.length - 1]
  const hasBandFilter = Boolean(dashboardFilters.highCostBand)
  const hasClaimantFilter = Boolean(dashboardFilters.topClaimantId)

  const handleResetRange = () => {
    if (monthRange.length === 0) return
    handleRangeUpdate(monthRange[0], monthRange[monthRange.length - 1])
  }

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    [],
  )

  const varianceInsights = useMemo(() => {
    if (filteredActualData.length === 0) return []
    const sorted = [...filteredActualData].sort((a, b) => b.variance - a.variance)
    const largestOver = sorted.find(item => item.variance > 0)
    const largestUnder = [...sorted].reverse().find(item => item.variance < 0)
    const notes: string[] = []
    if (largestOver) {
      notes.push(`${largestOver.month}: ${currencyFormatter.format(Math.abs(largestOver.variance))} over budget`)
    }
    if (largestUnder) {
      notes.push(`${largestUnder.month}: ${currencyFormatter.format(Math.abs(largestUnder.variance))} under budget`)
    }
    return notes
  }, [filteredActualData, currencyFormatter])

  const varianceInsightsContent = varianceInsights.length > 0
    ? (
      <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
        {varianceInsights.map(item => (
          <li key={item} className="flex items-center gap-2">
            <span className="text-[var(--accent)]">●</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
    : undefined

  const activeBandDetails = useMemo(() => {
    if (!activeBandLabel) return null
    const band = amountBands.find(item => item.label === activeBandLabel)
    if (!band) return null
    return `${band.count.toLocaleString()} members • ${currencyFormatter.format(band.totalAmount)} paid`
  }, [activeBandLabel, amountBands, currencyFormatter])

  const filterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []

    if (!isFullRange && startMonth && endMonth) {
      chips.push({
        key: 'range',
        label: `${formatMonthShort(startMonth)} → ${formatMonthShort(endMonth)}`,
        onRemove: handleResetRange,
      })
    }

    if (dashboardFilters.highCostBand) {
      chips.push({
        key: 'band',
        label: `Band · ${dashboardFilters.highCostBand}`,
        onRemove: clearBandFilter,
      })
    }

    if (dashboardFilters.topClaimantId) {
      chips.push({
        key: 'claimant',
        label: `Member · ${dashboardFilters.topClaimantId}`,
        onRemove: clearClaimantFilter,
      })
    }

    return chips
  }, [
    clearBandFilter,
    clearClaimantFilter,
    dashboardFilters.highCostBand,
    dashboardFilters.topClaimantId,
    endMonth,
    formatMonthShort,
    handleResetRange,
    isFullRange,
    startMonth,
  ])

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

  const filteredLossRatioSummaries = useMemo(
    () =>
      lossRatioSummaries.filter(summary => {
        if (startMonth && summary.month < startMonth) return false
        if (endMonth && summary.month > endMonth) return false
        return true
      }),
    [lossRatioSummaries, startMonth, endMonth],
  )

  const filteredFinancialMetrics = useMemo(
    () =>
      financialMetrics.filter(metric => {
        if (startMonth && metric.month < startMonth) return false
        if (endMonth && metric.month > endMonth) return false
        return true
      }),
    [financialMetrics, startMonth, endMonth],
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
      <SurfaceCard
        hover={false}
        padding="snug"
        className={`min-h-[320px] items-center justify-center text-center text-[var(--muted-foreground)] ${className}`}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10">
          <svg className="h-12 w-12 text-[var(--muted-foreground)]/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l3-3 4 4 5-6" />
          </svg>
          <p className="text-base font-semibold text-[var(--foreground)]">Charts unlock after data upload</p>
          <p className="max-w-md text-sm text-[var(--muted-foreground)]">
            Complete the earlier steps to populate the dashboard visuals and analytics.
          </p>
        </div>
      </SurfaceCard>
    )
  }

  return (
    <div className={`flex flex-col gap-12 ${className}`}>
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
          {filterChips.map(chip => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)]/80 px-3 py-1 text-[var(--muted-foreground)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      <section className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard
          title="Monthly Actual vs Budget"
          subtitle="Compare actual claims and expenses against the planned budget."
          className="xl:col-span-2"
          actions={
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              {!isFullRange && (
                <button
                  type="button"
                  onClick={handleResetRange}
                  className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => exportChartAsImage(monthlyChartRef.current, 'monthly-actual-vs-budget')}
                className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
              >
                Export PNG
              </button>
            </div>
          }
          footer={varianceInsightsContent}
        >
          {monthRange.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <button
                type="button"
                onClick={() => {
                  const startIndex = Math.max(0, monthRange.length - 3)
                  handleRangeUpdate(monthRange[startIndex], monthRange[monthRange.length - 1])
                }}
                className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)]/80 px-3 py-1 font-semibold uppercase tracking-[0.28em] text-[var(--foreground)] transition hover:bg-[var(--muted-background)]"
              >
                Last 3
              </button>
              <button
                type="button"
                onClick={() => {
                  const startIndex = Math.max(0, monthRange.length - 6)
                  handleRangeUpdate(monthRange[startIndex], monthRange[monthRange.length - 1])
                }}
                className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)]/80 px-3 py-1 font-semibold uppercase tracking-[0.28em] text-[var(--foreground)] transition hover:bg-[var(--muted-background)]"
              >
                Last 6
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentYear = new Date().getFullYear().toString()
                  const ytdStart = monthRange.find(month => month.startsWith(currentYear)) || monthRange[0]
                  handleRangeUpdate(ytdStart, monthRange[monthRange.length - 1])
                }}
                className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)]/80 px-3 py-1 font-semibold uppercase tracking-[0.28em] text-[var(--foreground)] transition hover:bg-[var(--muted-background)]"
              >
                YTD
              </button>
              <button
                type="button"
                onClick={() => handleRangeUpdate(monthRange[0], monthRange[monthRange.length - 1])}
                className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)]/80 px-3 py-1 font-semibold uppercase tracking-[0.28em] text-[var(--foreground)] transition hover:bg-[var(--muted-background)]"
              >
                All
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-2 text-[var(--muted-foreground)]">
                <span>From</span>
                <select
                  value={startMonth}
                  onChange={event => {
                    const value = event.target.value
                    const nextEnd = value > endMonth ? value : endMonth
                    handleRangeUpdate(value, nextEnd)
                  }}
                  className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)] px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                >
                    {monthRange.map(month => (
                      <option key={month} value={month}>
                        {formatMonthShort(month)}
                      </option>
                    ))}
                </select>
                <span>To</span>
                <select
                  value={endMonth}
                  onChange={event => {
                    const value = event.target.value
                    const nextStart = value < startMonth ? value : startMonth
                    handleRangeUpdate(nextStart, value)
                  }}
                  className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)] px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                >
                    {monthRange.map(month => (
                      <option key={month} value={month}>
                        {formatMonthShort(month)}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
          <div ref={monthlyChartRef} className="flex-1 min-h-[320px]">
            <MonthlyActualBudgetChart
              data={actualVsBudgetData}
              height={340}
              visibleRange={{ start: startMonth, end: endMonth }}
              focusMonth={dashboardFocus.month}
              onMonthFocus={handleMonthFocus}
              onMonthSelect={handleMonthSelect}
              onRangeChange={handleRangeUpdate}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Loss Ratio Trend"
          subtitle="Twelve-month view with benchmarks at 80% and 100%."
        >
          <div className="flex-1 min-h-[260px]">
            <LossRatioTrendChart summaries={filteredLossRatioSummaries} height={260} />
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Cost Breakdown"
          subtitle="Distribution of spend across medical, pharmacy, administrative, and recoveries."
          className="xl:col-span-2"
        >
          <div className="min-h-[320px]">
            <CostBreakdownChart financialMetrics={filteredFinancialMetrics} height={320} />
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <SurfaceCard
          title="Fuel Gauge"
          subtitle="Cumulative spend versus plan with stop-loss reference."
          hover={false}
        >
          <LossGaugeCard
            fuelPercent={fuelPercent}
            stopLossPercent={stopLossPercent}
            mode="fuel"
            onModeChange={() => {}}
            hideModeSwitcher
            className="flex-1"
            targetPercent={stopLossTargetPct}
          />
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--muted-foreground)]">
              <span>Scenario Target</span>
              <span className="tabular-nums text-[var(--foreground)]">{stopLossTargetPct}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={140}
              step={1}
              value={stopLossTargetPct}
              onChange={event => handleStopLossTargetChange(Number(event.target.value))}
              className="h-2 w-full cursor-pointer rounded-full bg-[var(--surface-border)]"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="flex justify-between text-[10px] uppercase tracking-[0.25em] text-[var(--muted-foreground)]/70">
              <span>80%</span>
              <span>110%</span>
              <span>140%</span>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Top High-Cost Claimants"
          subtitle="Leading members ranked by paid amount and share of cohort."
          className="xl:col-span-1"
          actions={
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              {hasClaimantFilter && (
                <button
                  type="button"
                  onClick={clearClaimantFilter}
                  className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => exportChartAsImage(topClaimantsChartRef.current, 'top-claimants')}
                className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
              >
                Export PNG
              </button>
            </div>
          }
        >
          <div ref={topClaimantsChartRef} className="flex-1 min-h-[260px]">
            <TopClaimantsChart
              claimants={topClaimantsData}
              height={260}
              activeClaimantId={activeClaimantId}
              onClaimantFocus={handleClaimantFocus}
              onClaimantSelect={handleClaimantSelect}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="High-Cost Claimants by Band"
          subtitle="Count of members grouped by paid-amount ranges."
          footer={activeBandDetails ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              {activeBandDetails}
            </p>
          ) : undefined}
          actions={
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              {hasBandFilter && (
                <button
                  type="button"
                  onClick={clearBandFilter}
                  className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => exportChartAsImage(bandsChartRef.current, 'claimant-bands')}
                className="rounded-full border border-[color:var(--surface-border)] px-3 py-1 text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
              >
                Export PNG
              </button>
            </div>
          }
        >
          <div ref={bandsChartRef} className="flex-1 min-h-[260px]">
            <HighCostBandsChart
              data={amountBands}
              height={260}
              activeBand={activeBandLabel}
              onBandFocus={handleBandFocus}
              onBandSelect={handleBandSelect}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Enrollment Trend"
          subtitle="Employee participation over the selected period."
          className="lg:col-span-2 xl:col-span-3"
        >
          <div className="flex-1 min-h-[240px]">
            <EnrollmentTrendChart data={enrollmentTrendData} height={240} />
          </div>
        </SurfaceCard>
      </section>
    </div>
  )
}
