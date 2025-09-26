'use client'

import { useMemo } from 'react'
import { useSummaries, useExperienceData, useHighCostClaimants, useFinancialMetrics } from '@/lib/store/useAppStore'
import { calculateTotals } from '@/lib/calc/lossRatio'
import {
  aggregateByCategory,
  getTopClaimants,
  getClaimantAmountBands,
} from '@/lib/calc/aggregations'
import { MonthlyActualBudgetChart } from '@/components/charts/MonthlyActualBudgetChart'
import EnrollmentTrendChart from '@/components/charts/EnrollmentTrendChart'
import LossGaugeCard from '@/components/charts/LossGaugeCard'
import { CostBreakdownChart } from '@/components/charts/CostBreakdownChart'
import { LossRatioTrendChart } from '@/components/charts/LossRatioTrendChart'
import { TopClaimantsChart } from '@/components/charts/TopClaimantsChart'
import { HighCostBandsChart } from '@/components/charts/HighCostBandsChart'
import './print-styles.css'

export default function PrintContainer() {
  const summaries = useSummaries()
  const experience = useExperienceData()
  const financialMetrics = useFinancialMetrics()
  const highCostClaimants = useHighCostClaimants()
  const totals = calculateTotals(summaries)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const formatPercent = (ratio: number | null) => {
    if (ratio === null || Number.isNaN(ratio)) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(ratio)
  }

  const getLatestR12 = () => {
    for (let i = summaries.length - 1; i >= 0; i -= 1) {
      if (summaries[i].r12LossRatio !== null) {
        return summaries[i].r12LossRatio
      }
    }
    return null
  }

  const categoryTotals = useMemo(() => aggregateByCategory(experience), [experience])
  const topClaimants = useMemo(() => getTopClaimants(highCostClaimants, 10), [highCostClaimants])
  const amountBands = useMemo(() => getClaimantAmountBands(highCostClaimants), [highCostClaimants])

  const printableLossRatioSummaries = useMemo(
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

  const budgetTotalsByMonth = useMemo(() => {
    const totalsMap = new Map<string, number>()
    experience.forEach(row => {
      const normalizedCategory = row.category.trim().toLowerCase()
      if (normalizedCategory.includes('budget') && normalizedCategory.includes('x ee')) {
        totalsMap.set(row.month, (totalsMap.get(row.month) ?? 0) + row.amount)
      }
    })
    return totalsMap
  }, [experience])

  const actualVsBudgetData = useMemo(
    () =>
      financialMetrics.map(metric => {
        const [year, month] = metric.month.split('-')
        const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })

        const budgetTotal = budgetTotalsByMonth.get(metric.month) ?? metric.monthlyBudget

        return {
          month: label,
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

  const enrollmentTrendData = useMemo(
    () =>
      actualVsBudgetData.map(item => ({
        month: item.rawMonth,
        label: item.month,
        enrollment: item.eeCount,
      })),
    [actualVsBudgetData],
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

  const totalClaims = summaries.reduce((sum, s) => sum + s.claims, 0)
  const totalCost = summaries.reduce((sum, s) => sum + s.totalCost, 0)
  const avgLossRatio = summaries.length > 0
    ? summaries.reduce((sum, s) => sum + (s.lossRatio || 0), 0) /
        Math.max(1, summaries.filter(s => s.lossRatio !== null).length)
    : 0
  return (
    <div className="print-container">
      {/* Page 1: Summary Table */}
      <div className="print-page">
        <div className="print-header">
          <h1>Healthcare Claims Analysis Report</h1>
          <div className="report-meta">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div>
              Period:&nbsp;
              {summaries.length > 0
                ? `${summaries[0].month} to ${summaries[summaries.length - 1].month}`
                : 'N/A'}
            </div>
          </div>
        </div>

        <div className="executive-summary">
          <h2>Executive Summary</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-label">Total Claims</div>
              <div className="summary-value">{formatCurrency(totalClaims)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Costs</div>
              <div className="summary-value">{formatCurrency(totalCost)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Average Loss Ratio</div>
              <div className="summary-value">{formatPercent(avgLossRatio)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Latest R12 Loss Ratio</div>
              <div className="summary-value">{formatPercent(getLatestR12())}</div>
            </div>
          </div>
        </div>

        <div className="summary-table-section">
          <h2>Monthly Summary</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Claims</th>
                <th>Premium</th>
                <th>Fees Total</th>
                <th>Total Cost</th>
                <th>Loss Ratio</th>
                <th>Rolling-12 LR</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((summary, index) => (
                <tr key={summary.month} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <td className="font-medium">{summary.month}</td>
                  <td>{formatCurrency(summary.claims)}</td>
                  <td>{formatCurrency(summary.premium)}</td>
                  <td>{formatCurrency(summary.feesTotal)}</td>
                  <td>{formatCurrency(summary.totalCost)}</td>
                  <td
                    className={`font-medium ${
                      summary.lossRatio === null
                        ? 'text-gray'
                        : summary.lossRatio > 1
                        ? 'text-red'
                        : summary.lossRatio > 0.8
                        ? 'text-yellow'
                        : 'text-green'
                    }`}
                  >
                    {formatPercent(summary.lossRatio)}
                  </td>
                  <td
                    className={`font-medium ${
                      summary.r12LossRatio === null
                        ? 'text-gray'
                        : summary.r12LossRatio > 1
                        ? 'text-red'
                        : summary.r12LossRatio > 0.8
                        ? 'text-yellow'
                        : 'text-green'
                    }`}
                  >
                    {formatPercent(summary.r12LossRatio)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td className="font-bold">TOTAL</td>
                <td className="font-bold">{formatCurrency(totals.claims)}</td>
                <td className="font-bold">{formatCurrency(totals.premium)}</td>
                <td className="font-bold">{formatCurrency(totals.feesTotal)}</td>
                <td className="font-bold">{formatCurrency(totals.totalCost)}</td>
                <td className="font-bold">{formatPercent(totals.premium > 0 ? totals.claims / totals.premium : null)}</td>
                <td className="font-bold">—</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="page-footer">
          <div className="legend">
            <div className="legend-item">
              <span className="legend-color green"></span>
              <span>Good (≤80%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color yellow"></span>
              <span>Watch (80-100%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color red"></span>
              <span>Concern (&gt;100%)</span>
            </div>
          </div>
          <p className="note">
            <strong>Latest Rolling-12 Loss Ratio:</strong> {formatPercent(getLatestR12())}
          </p>
          <p className="note">
            Rolling-12 Loss Ratio requires at least 12 months of data. Loss ratios above 100% indicate claims exceed premium revenue.
          </p>
        </div>
      </div>

      {/* Page 2: Core Charts */}
      <div className="print-page">
        <div className="print-header">
          <h1>Analytics Dashboard — Overview</h1>
          <div className="report-meta">
            <div>Charts rendered for print export</div>
          </div>
        </div>

        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-title">Actual vs Budget</div>
            <div className="chart-caption">Monthly claims and expenses compared with budget targets.</div>
            <div className="chart-area">
              <MonthlyActualBudgetChart data={actualVsBudgetData} height={220} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Enrollment Trend</div>
            <div className="chart-caption">Participant counts across the reporting period.</div>
            <div className="chart-area">
              <EnrollmentTrendChart data={enrollmentTrendData} height={220} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Fuel Gauge (Cumulative vs Budget)</div>
            <div className="chart-caption">Cumulative spend against plan with stop-loss reference.</div>
            <div className="chart-area gauge-area">
              <LossGaugeCard
                fuelPercent={fuelPercent}
                stopLossPercent={stopLossPercent}
                mode="fuel"
                onModeChange={() => {}}
                hideModeSwitcher
                className="h-full"
              />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Cost Distribution</div>
            <div className="chart-caption">Medical, pharmacy, administrative, and recovery mix year-to-date.</div>
            <div className="chart-area">
              <CostBreakdownChart financialMetrics={financialMetrics} height={220} />
            </div>
          </div>
        </div>
      </div>

      {/* Page 3: Deep Dive Charts */}
      <div className="print-page">
        <div className="print-header">
          <h1>Analytics Dashboard — Detail</h1>
          <div className="report-meta">
            <div>High-cost exposure and performance trends</div>
          </div>
        </div>

        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-title">Loss Ratio Trend</div>
            <div className="chart-caption">Monthly and rolling loss ratios with key reference lines.</div>
            <div className="chart-area">
              <LossRatioTrendChart summaries={printableLossRatioSummaries} height={220} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Top Claimants</div>
            <div className="chart-caption">Leading members by paid amount and share of spend.</div>
            <div className="chart-area">
              <TopClaimantsChart claimants={topClaimants} height={220} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">High-Cost Amount Bands</div>
            <div className="chart-caption">Members per claim band with paid dollars and cohort share.</div>
            <div className="chart-area">
              <HighCostBandsChart data={amountBands} height={220} />
            </div>
          </div>

          <div className="chart-card textual-card">
            <div className="chart-title">Top Categories Snapshot</div>
            <div className="chart-caption">Leading cost categories by total dollars this period.</div>
            <div className="chart-area category-area">
              {categoryTotals.slice(0, 6).map(category => (
                <div key={category.category} className="category-line">
                  <div className="category-name">{category.category}</div>
                  <div className="category-metric">
                    <span>{formatCurrency(category.amount)}</span>
                    <span>{category.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
              {categoryTotals.length === 0 && (
                <div className="empty-state">No category detail available.</div>
              )}
            </div>
          </div>
        </div>

        <div className="report-footer">
          <p>Prepared using the Healthcare Analytics Dashboard export workflow.</p>
          <p>For questions about this report, contact your analytics team.</p>
        </div>
      </div>
    </div>
  )
}
