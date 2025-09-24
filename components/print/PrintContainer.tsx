'use client'

import { useSummaries, useExperienceData, useMemberClaims } from '@/lib/store/useAppStore'
import { calculateTotals } from '@/lib/calc/lossRatio'
import { aggregateByCategory, getTopClaimants } from '@/lib/calc/aggregations'
import { SimpleKPICard } from '@/components/charts/SimpleKPICard'
import './print-styles.css'

export default function PrintContainer() {
  const summaries = useSummaries()
  const experience = useExperienceData()
  const memberClaims = useMemberClaims()
  const totals = calculateTotals(summaries)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  const formatPercent = (ratio: number | null) => {
    if (ratio === null) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(ratio)
  }
  
  const getLatestR12 = () => {
    for (let i = summaries.length - 1; i >= 0; i--) {
      if (summaries[i].r12LossRatio !== null) {
        return summaries[i].r12LossRatio
      }
    }
    return null
  }
  
  const categoryTotals = aggregateByCategory(experience)
  const topClaimants = getTopClaimants(memberClaims, 10)
  
  // Calculate key metrics
  const totalClaims = summaries.reduce((sum, s) => sum + s.claims, 0)
  const totalCost = summaries.reduce((sum, s) => sum + s.totalCost, 0)
  const avgLossRatio = summaries.length > 0 
    ? summaries.reduce((sum, s) => sum + (s.lossRatio || 0), 0) / summaries.filter(s => s.lossRatio !== null).length
    : 0
  const avgClaimAmount = experience.length > 0 
    ? experience.reduce((sum, row) => sum + row.amount, 0) / experience.length
    : 0
  
  return (
    <div className="print-container">
      {/* Page 1: Summary Table */}
      <div className="print-page">
        {/* Header */}
        <div className="print-header">
          <h1>Healthcare Claims Analysis Report</h1>
          <div className="report-meta">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div>Period: {summaries.length > 0 ? `${summaries[0].month} to ${summaries[summaries.length - 1].month}` : 'N/A'}</div>
          </div>
        </div>
        
        {/* Executive Summary */}
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

        {/* Summary Table */}
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
                  <td className={`font-medium ${
                    summary.lossRatio === null 
                      ? 'text-gray'
                      : summary.lossRatio > 1
                      ? 'text-red'
                      : summary.lossRatio > 0.8
                      ? 'text-yellow'
                      : 'text-green'
                  }`}>
                    {formatPercent(summary.lossRatio)}
                  </td>
                  <td className={`font-medium ${
                    summary.r12LossRatio === null 
                      ? 'text-gray'
                      : summary.r12LossRatio > 1
                      ? 'text-red'
                      : summary.r12LossRatio > 0.8
                      ? 'text-yellow'
                      : 'text-green'
                  }`}>
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

        {/* Footer Notes */}
        <div className="page-footer">
          <div className="legend">
            <div className="legend-item">
              <span className="legend-color green"></span>
              <span>Good (≤80%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color yellow"></span>
              <span>Warning (80-100%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color red"></span>
              <span>Concern (>100%)</span>
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

      {/* Page 2: Charts and Analytics */}
      <div className="print-page">
        <div className="print-header">
          <h1>Analytics Dashboard</h1>
          <div className="report-meta">
            <div>Key Performance Indicators and Trends</div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-title">Total Claims</div>
            <div className="kpi-value">{formatCurrency(totalClaims)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Total Cost</div>
            <div className="kpi-value">{formatCurrency(totalCost)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Avg Loss Ratio</div>
            <div className="kpi-value">{formatPercent(avgLossRatio)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Avg Claim Amount</div>
            <div className="kpi-value">{formatCurrency(avgClaimAmount)}</div>
          </div>
        </div>

        {/* Categories Analysis */}
        <div className="analysis-section">
          <h2>Top Categories by Claims Amount</h2>
          <div className="categories-list">
            {categoryTotals.slice(0, 8).map((category, index) => (
              <div key={category.category} className="category-item">
                <div className="category-bar">
                  <div 
                    className="category-fill" 
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <div className="category-details">
                  <span className="category-name">{category.category}</span>
                  <span className="category-amount">{formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Cost Analysis */}
        {memberClaims.length > 0 && topClaimants.length > 0 && (
          <div className="analysis-section">
            <h2>High-Cost Members</h2>
            <div className="claimants-list">
              {topClaimants.slice(0, 8).map((claimant, index) => (
                <div key={claimant.memberId} className="claimant-item">
                  <div className="claimant-rank">#{index + 1}</div>
                  <div className="claimant-id">{claimant.memberId}</div>
                  <div className="claimant-amount">{formatCurrency(claimant.totalAmount)}</div>
                  <div className="claimant-percent">{claimant.percentage.toFixed(1)}%</div>
                  <div className="claimant-count">{claimant.claimCount} claims</div>
                </div>
              ))}
            </div>
            <div className="claimants-summary">
              Top 3 members represent {topClaimants.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0).toFixed(1)}% of total claims
            </div>
          </div>
        )}

        {/* Report Footer */}
        <div className="report-footer">
          <p>This report was generated using the Healthcare Claims Analysis Dashboard.</p>
          <p>For questions or additional analysis, please contact your benefits administrator.</p>
        </div>
      </div>
    </div>
  )
}