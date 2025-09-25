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
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2f6d55] text-white font-medium rounded-lg shadow-sm hover:!bg-[#275746] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Export PDF Report
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#fdf9f2] rounded-2xl shadow-sm border border-[#eadfce] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[#eadfce] bg-[#f5ede0]">
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#3d382f]">
                  Month
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#3d382f]">
                  Claims
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#3d382f]">
                  Premium
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#3d382f]">
                  Fees Total
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#3d382f]">
                  Total Cost
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#3d382f]">
                  Loss Ratio
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#3d382f]">
                  Rolling-12 LR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e4d0]">
              {summaries.map((summary, index) => (
                <tr 
                  key={summary.month} 
                  className={`transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#fbf6ed]'
                  } hover:!bg-[#f3ede2]`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-[#33302a]">
                    {summary.month}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[#33302a]">
                    {formatCurrency(summary.claims)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[#33302a]">
                    {formatCurrency(summary.premium)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[#33302a]">
                    {formatCurrency(summary.feesTotal)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[#33302a]">
                    {formatCurrency(summary.totalCost)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${
                    summary.lossRatio === null 
                      ? 'text-[#9b9287]'
                      : summary.lossRatio > 1
                      ? 'text-[#c75237]'
                      : summary.lossRatio > 0.8
                      ? 'text-[#b3872a]'
                      : 'text-[#2f6d55]'
                  }`}>
                    {formatPercent(summary.lossRatio)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${
                    summary.r12LossRatio === null 
                      ? 'text-[#9b9287]'
                      : summary.r12LossRatio > 1
                      ? 'text-[#c75237]'
                      : summary.r12LossRatio > 0.8
                      ? 'text-[#b3872a]'
                      : 'text-[#2f6d55]'
                  }`}>
                    {formatPercent(summary.r12LossRatio)}
                  </td>
                </tr>
              ))}
            </tbody>
            
            {/* Totals Footer */}
            <tfoot className="bg-[#f3ede2]">
              <tr className="border-t-2 border-[#e2d6c3]">
                <td className="px-4 py-4 text-sm font-bold text-[#33302a]">
                  TOTAL
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-[#33302a]">
                  {formatCurrency(totals.claims)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-[#33302a]">
                  {formatCurrency(totals.premium)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-[#33302a]">
                  {formatCurrency(totals.feesTotal)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-[#33302a]">
                  {formatCurrency(totals.totalCost)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-[#675f55]">
                  {formatPercent(totals.premium > 0 ? totals.claims / totals.premium : null)}
                </td>
                <td className="px-4 py-4 text-sm text-right font-bold text-[#675f55]">
                  —
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="text-sm text-[#5b5247] space-y-2">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#4f8a65' }}></div>
            <span>Good (≤80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#d5a851' }}></div>
            <span>Warning (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#c75237' }}></div>
            <span>Concern (&gt;100%)</span>
          </div>
        </div>
        <div className="border-t border-[#eadfce] pt-4">
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
