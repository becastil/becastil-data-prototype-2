'use client'

import { useSummaries } from '@/lib/store/useAppStore'
import { calculateTotals } from '@/lib/calc/lossRatio'

interface SummaryTableProps {
  onExport?: () => void
}

export default function SummaryTable({ onExport }: SummaryTableProps) {
  const summaries = useSummaries()
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
  
  if (summaries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No summary data available. Please upload experience data and complete the fees form first.
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Export PDF Report
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                  Month
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                  Claims
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                  Premium
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                  Fees Total
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                  Total Cost
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                  Loss Ratio
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                  Rolling-12 LR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {summaries.map((summary, index) => (
                <tr 
                  key={summary.month} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-750'
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {summary.month}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(summary.claims)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(summary.premium)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(summary.feesTotal)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(summary.totalCost)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${
                    summary.lossRatio === null 
                      ? 'text-gray-400 dark:text-gray-500'
                      : summary.lossRatio > 1
                      ? 'text-red-600 dark:text-red-400'
                      : summary.lossRatio > 0.8
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {formatPercent(summary.lossRatio)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${
                    summary.r12LossRatio === null 
                      ? 'text-gray-400 dark:text-gray-500'
                      : summary.r12LossRatio > 1
                      ? 'text-red-600 dark:text-red-400'
                      : summary.r12LossRatio > 0.8
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {formatPercent(summary.r12LossRatio)}
                  </td>
                </tr>
              ))}
            </tbody>
            
            {/* Totals Footer */}
            <tfoot className="bg-gray-100 dark:bg-gray-700">
              <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                <td className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                  TOTAL
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totals.claims)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totals.premium)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totals.feesTotal)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totals.totalCost)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-gray-600 dark:text-gray-400">
                  {formatPercent(totals.premium > 0 ? totals.claims / totals.premium : null)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-gray-600 dark:text-gray-400">
                  —
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Good (≤80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Warning (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Concern (>100%)</span>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p><strong>Latest Rolling-12 Loss Ratio:</strong> {formatPercent(getLatestR12())}</p>
          <p className="mt-1">
            <strong>Note:</strong> Rolling-12 Loss Ratio requires at least 12 months of data. 
            Loss ratios above 100% indicate claims exceed premium revenue.
          </p>
        </div>
      </div>
    </div>
  )
}