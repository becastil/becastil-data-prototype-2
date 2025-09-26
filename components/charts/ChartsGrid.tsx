'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
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

const TILE_BASE =
  'min-h-[420px] rounded-3xl border border-[color:var(--surface-border)] bg-[var(--surface)]/95 p-6 shadow-[0_24px_55px_-32px_rgba(15,23,42,0.55)] flex flex-col gap-5 transition-colors duration-300'

interface ChartTile {
  id: string
  header: ReactNode
  content: ReactNode
  accent?: string
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

interface TileHeaderProps {
  badge?: string
  badgeClassName?: string
  title: string
  description?: string
}

function TileHeader({ badge, badgeClassName = 'from-indigo-500/30 via-indigo-500/10 to-transparent text-indigo-700 dark:text-indigo-200', title, description }: TileHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {badge ? (
          <span
            className={`inline-flex items-center rounded-full bg-gradient-to-r px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${badgeClassName}`}
          >
            {badge}
          </span>
        ) : null}
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      </div>
      {description ? (
        <p className="text-sm leading-relaxed text-[var(--foreground)]/70">{description}</p>
      ) : null}
    </div>
  )
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const formatDeltaCurrency = (value: number) => {
  if (value === 0) return currencyFormatter.format(0)
  const prefix = value > 0 ? '+' : '-'
  return `${prefix}${currencyFormatter.format(Math.abs(value))}`
}

const formatDeltaPercent = (value: number) => {
  if (value === 0) return '0.0%'
  const prefix = value > 0 ? '+' : '-'
  return `${prefix}${Math.abs(value).toFixed(1)}%`
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

  const filteredEnrollmentData = useMemo(
    () =>
      filteredActualData.map(item => ({
        month: item.rawMonth,
        label: item.month,
        enrollment: item.eeCount,
      })),
    [filteredActualData],
  )

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

  const [gaugeMode, setGaugeMode] = useState<'fuel' | 'stopLoss'>('fuel')

  const lossRatioSummaries = useMemo(
    () =>
      summaries.map((summary, index) => ({
        month: summary.month || `Month ${index + 1}`,
        claims: summary.claims,
        premium: summary.premium,
        feesTotal: 0,
        totalCost: summary.claims,
        lossRatio: summary.premium > 0 ? summary.claims / summary.premium : null,
        r12LossRatio: null,
      })),
    [summaries],
  )

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

  const varianceSnapshot = useMemo(() => {
    if (financialMetrics.length < 2) return null
    const current = financialMetrics[financialMetrics.length - 1]
    const previous = financialMetrics[financialMetrics.length - 2]

    const costChange = current.monthlyClaimsAndExpenses - previous.monthlyClaimsAndExpenses
    const costChangePct =
      previous.monthlyClaimsAndExpenses > 0
        ? (costChange / previous.monthlyClaimsAndExpenses) * 100
        : 0
    const enrollmentChange = current.eeCount - previous.eeCount

    const totalActualYtd = financialMetrics.reduce((sum, metric) => sum + metric.monthlyClaimsAndExpenses, 0)
    const totalBudgetYtd = financialMetrics.reduce((sum, metric) => sum + metric.monthlyBudget, 0)
    const ytdVariancePct = totalBudgetYtd > 0 ? ((totalActualYtd - totalBudgetYtd) / totalBudgetYtd) * 100 : 0

    return {
      costChange,
      costChangePct,
      enrollmentChange,
      latestMonthLabel: new Date(current.month + '-01').toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      ytdVariancePct,
    }
  }, [financialMetrics])

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

  const tiles: ChartTile[] = [
    {
      id: 'kpi-dashboard',
      accent: 'bg-gradient-to-br from-indigo-500/12 via-[var(--surface)] to-transparent dark:from-indigo-500/8',
      header: (
        <TileHeader
          badge="Snapshot"
          title="Key Performance Indicators"
          description="Quick pulse on the program’s health with year-to-date totals, averages, and current ratios."
        />
      ),
      content: <KPIDashboard financialMetrics={financialMetrics} summaries={summaries} className="flex-1" />,
    },
    {
      id: 'actual-vs-budget',
      accent: 'bg-gradient-to-br from-rose-500/12 via-[var(--surface)] to-transparent dark:from-rose-500/8',
      header: (
        <TileHeader
          badge="Financial"
          badgeClassName="from-rose-500/30 via-rose-500/10 to-transparent text-rose-600 dark:text-rose-200"
          title="Actual Claims & Budget Overlay"
          description="Track monthly spend against budget with quick presets and manual month filters."
        />
      ),
      content: (
        <div className="flex flex-1 flex-col gap-5">
          {monthRange.length > 1 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const startIndex = Math.max(0, monthRange.length - 3)
                    setStartMonth(monthRange[startIndex])
                    setEndMonth(monthRange[monthRange.length - 1])
                  }}
                  className="rounded-full bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-600 transition hover:from-rose-500/25 hover:via-rose-500/15 dark:text-rose-200"
                >
                  Last 3 Months
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const startIndex = Math.max(0, monthRange.length - 6)
                    setStartMonth(monthRange[startIndex])
                    setEndMonth(monthRange[monthRange.length - 1])
                  }}
                  className="rounded-full bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-600 transition hover:from-rose-500/25 hover:via-rose-500/15 dark:text-rose-200"
                >
                  Last 6 Months
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentYear = new Date().getFullYear().toString()
                    const ytdStart = monthRange.find(month => month.startsWith(currentYear)) || monthRange[0]
                    setStartMonth(ytdStart)
                    setEndMonth(monthRange[monthRange.length - 1])
                  }}
                  className="rounded-full bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-600 transition hover:from-rose-500/25 hover:via-rose-500/15 dark:text-rose-200"
                >
                  YTD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartMonth(monthRange[0])
                    setEndMonth(monthRange[monthRange.length - 1])
                  }}
                  className="rounded-full bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-600 transition hover:from-rose-500/25 hover:via-rose-500/15 dark:text-rose-200"
                >
                  All Data
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--foreground)]/70">
                <label className="flex items-center gap-2">
                  <span>From</span>
                  <select
                    value={startMonth}
                    onChange={event => setStartMonth(event.target.value)}
                    className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)] px-3 py-1 text-sm font-medium text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
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
                    className="rounded-full border border-[color:var(--surface-border)] bg-[var(--muted-background)] px-3 py-1 text-sm font-medium text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  >
                    {monthRange.map(month => (
                      <option key={month} value={month}>
                        {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="text-xs text-[var(--foreground)]/50">
                  Showing {filteredActualData.length} month{filteredActualData.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          )}
          <div className="flex-1">
            <MonthlyActualBudgetChart data={filteredActualData} height={320} />
          </div>
        </div>
      ),
    },
    {
      id: 'enrollment-trend',
      accent: 'bg-gradient-to-br from-fuchsia-500/12 via-[var(--surface)] to-transparent dark:from-fuchsia-500/8',
      header: (
        <TileHeader
          badge="Growth"
          badgeClassName="from-pink-500/30 via-pink-500/10 to-transparent text-pink-600 dark:text-pink-200"
          title="Enrollment Trend"
          description="Follow participation momentum with a vivid line trend and soft gradient fill."
        />
      ),
      content: <EnrollmentTrendChart data={filteredEnrollmentData} height={280} />,
    },
    {
      id: 'fuel-gauge',
      accent: 'bg-gradient-to-br from-amber-500/12 via-[var(--surface)] to-transparent dark:from-amber-500/10',
      header: (
        <TileHeader
          badge="Focus"
          badgeClassName="from-amber-500/30 via-amber-500/10 to-transparent text-amber-600 dark:text-amber-200"
          title="Fuel Gauge Insight"
          description="Monitor cumulative performance against budget alongside stop-loss recovery in a single glance."
        />
      ),
      content: (
        <div className="flex-1">
          <LossGaugeCard fuelPercent={fuelPercent} stopLossPercent={stopLossPercent} mode={gaugeMode} onModeChange={setGaugeMode} />
        </div>
      ),
    },
    {
      id: 'cost-breakdown',
      accent: 'bg-gradient-to-br from-teal-500/12 via-[var(--surface)] to-transparent dark:from-teal-500/8',
      header: (
        <TileHeader
          badge="Mix"
          badgeClassName="from-teal-500/30 via-teal-500/10 to-transparent text-teal-600 dark:text-teal-200"
          title="Cost Breakdown Distribution"
          description="See how medical, pharmacy, administration, and recoveries contribute to overall spend."
        />
      ),
      content: <CostBreakdownChart financialMetrics={financialMetrics} height={320} />,
    },
    {
      id: 'variance-summary',
      accent: 'bg-gradient-to-br from-sky-500/12 via-[var(--surface)] to-transparent dark:from-sky-500/8',
      header: (
        <TileHeader
          badge="Momentum"
          badgeClassName="from-sky-500/30 via-sky-500/10 to-transparent text-sky-600 dark:text-sky-200"
          title="Monthly Variance Highlights"
          description="Break down current month deltas, enrollment shifts, and year-to-date variance at a glance."
        />
      ),
      content: (
        <div className="flex-1">
          {varianceSnapshot ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/18 via-rose-500/6 to-transparent p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-600 dark:text-rose-200">This Month</p>
                <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{formatDeltaCurrency(varianceSnapshot.costChange)}</p>
                <p className="text-sm text-[var(--foreground)]/70">
                  vs previous month ({formatDeltaPercent(varianceSnapshot.costChangePct)})
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-teal-500/25 bg-gradient-to-br from-teal-500/18 via-teal-500/6 to-transparent p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-teal-600 dark:text-teal-200">Enrollment</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                    {varianceSnapshot.enrollmentChange === 0
                      ? 'No change'
                      : `${varianceSnapshot.enrollmentChange > 0 ? '+' : '-'}${Math.abs(varianceSnapshot.enrollmentChange)} people`}
                  </p>
                  <p className="text-sm text-[var(--foreground)]/70">Month-over-month headcount shift</p>
                </div>
                <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/18 via-amber-500/6 to-transparent p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-600 dark:text-amber-200">YTD Variance</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{formatDeltaPercent(varianceSnapshot.ytdVariancePct)}</p>
                  <p className="text-sm text-[var(--foreground)]/70">Cumulative actual vs budget</p>
                </div>
              </div>
              <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/18 via-sky-500/6 to-transparent p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-200">Latest Month</p>
                <p className="mt-2 text-base font-semibold text-[var(--foreground)]">{varianceSnapshot.latestMonthLabel}</p>
                <p className="text-sm text-[var(--foreground)]/70">Most recent period reported in financial metrics.</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[color:var(--surface-border)] bg-[var(--muted-background)]/70 px-4 text-center text-sm text-[var(--foreground)]/65">
              Need at least two months of financial metrics to calculate variance insights.
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'loss-ratio-trend',
      accent: 'bg-gradient-to-br from-blue-500/12 via-[var(--surface)] to-transparent dark:from-blue-500/8',
      header: (
        <TileHeader
          badge="Trajectory"
          badgeClassName="from-blue-500/30 via-blue-500/10 to-transparent text-blue-600 dark:text-blue-200"
          title="Loss Ratio Trend Analysis"
          description="Compare monthly and rolling 12-month loss ratios with break-even and target markers."
        />
      ),
      content: lossRatioSummaries.length > 0 ? (
        <LossRatioTrendChart summaries={lossRatioSummaries} height={320} />
      ) : (
        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[color:var(--surface-border)] bg-[var(--muted-background)]/70 px-4 text-center text-sm text-[var(--foreground)]/65">
          No loss ratio data available for trend analysis.
        </div>
      ),
    },
    {
      id: 'top-claimants',
      accent: 'bg-gradient-to-br from-violet-500/12 via-[var(--surface)] to-transparent dark:from-violet-500/8',
      header: (
        <TileHeader
          badge="Impact"
          badgeClassName="from-violet-500/30 via-violet-500/10 to-transparent text-violet-600 dark:text-violet-200"
          title="Top 10 High-Cost Claimants"
          description="Highlight members with the largest cost impact and their share of total spend."
        />
      ),
      content:
        topClaimantsData.length > 0 ? (
          <TopClaimantsChart claimants={topClaimantsData} height={320} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[color:var(--surface-border)] bg-[var(--muted-background)]/70 px-4 text-center text-sm text-[var(--foreground)]/65">
            Upload high-cost claimant data to unlock claimant analytics.
          </div>
        ),
    },
    {
      id: 'banded-claimants',
      accent: 'bg-gradient-to-br from-emerald-500/12 via-[var(--surface)] to-transparent dark:from-emerald-500/8',
      header: (
        <TileHeader
          badge="Distribution"
          badgeClassName="from-emerald-500/30 via-emerald-500/10 to-transparent text-emerald-600 dark:text-emerald-200"
          title="High-Cost Claimants by Paid Amount Band"
          description="Understand how many members fall into each high-cost band and the dollars represented."
        />
      ),
      content: (
        <div className="flex-1 space-y-4">
          <HighCostBandsChart data={amountBands} height={320} />
          {highCostClaimants.length === 0 && (
            <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[var(--muted-background)]/70 px-4 py-3 text-center text-xs text-[var(--foreground)]/65">
              Upload a high-cost claimant file to populate the banded overview.
            </div>
          )}
        </div>
      ),
    },
  ]

  const tilePages = chunkArray(tiles, 4)

  return (
    <div className={`space-y-16 ${className}`}>
      {tilePages.map((page, pageIndex) => (
        <section key={`chart-page-${pageIndex}`} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {page.map(tile => (
              <article key={tile.id} className={`${TILE_BASE} ${tile.accent ?? ''}`}>
                {tile.header}
                <div className="flex-1 overflow-hidden">{tile.content}</div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
