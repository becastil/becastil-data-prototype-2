'use client'

import { useState } from 'react'
import { useExperienceData, useHighCostClaimants, useSummaries } from '@/lib/store/useAppStore'
import {
  aggregateByCategory,
  aggregateByMonth,
  getTopClaimants,
  getDateRangeOptions,
  getTopDiagnosisCategories,
  getCostDistribution,
} from '@/lib/calc/aggregations'
import { StackedWithLineChart } from './StackedWithLineChart'
import { SimpleKPICard } from './SimpleKPICard'
import { TopCategoriesChart } from './TopCategoriesChart'
import { TopClaimantsChart } from './TopClaimantsChart'
import { LossRatioTrendChart } from './LossRatioTrendChart'
import HighCostTable from '@/components/high-cost/HighCostTable'
import DiagnosisBreakdownChart from '@/components/high-cost/DiagnosisBreakdownChart'

interface ChartsGridProps {
  className?: string
}

export default function ChartsGrid({ className = '' }: ChartsGridProps) {
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()
  const summaries = useSummaries()
  
  const [dateRange, setDateRange] = useState<string>('all')
  
  // Calculate data for charts
  const categoryTotals = aggregateByCategory(experience)
  const monthlyData = aggregateByMonth(experience)
  const topClaimants = getTopClaimants(highCostClaimants, 10)
  const diagnosisCategories = getTopDiagnosisCategories(highCostClaimants, 5)
  const costDistribution = getCostDistribution(highCostClaimants)
  
  // Get totals for KPI cards
  const totalClaims = summaries.reduce((sum, s) => sum + s.claims, 0)
  const totalCost = summaries.reduce((sum, s) => sum + s.totalCost, 0)
  const avgLossRatio = summaries.length > 0 
    ? summaries.reduce((sum, s) => sum + (s.lossRatio || 0), 0) / summaries.filter(s => s.lossRatio !== null).length
    : 0
  const avgClaimAmount = experience.length > 0 
    ? experience.reduce((sum, row) => sum + row.amount, 0) / experience.length
    : 0
  
  if (experience.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Complete the previous steps to view charts and analytics.
        </p>
      </div>
    )
  }
  
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Date Range Filter */}
      <div className="flex justify-end">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
        >
          {getDateRangeOptions(summaries.map(s => s.month)).map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards - Top Row (4 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SimpleKPICard
          title="Total Claims"
          value={totalClaims}
          format="currency"
          icon="claims"
        />
        <SimpleKPICard
          title="Total Cost"
          value={totalCost}
          format="currency"
          icon="cost"
        />
        <SimpleKPICard
          title="Avg Loss Ratio"
          value={avgLossRatio}
          format="percentage"
          icon="ratio"
        />
        <SimpleKPICard
          title="Avg Claim"
          value={avgClaimAmount}
          format="currency"
          icon="average"
        />
      </div>

      {/* Main Chart - Full Width */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Monthly Claims by Category with Loss Ratio Trend
        </h3>
        <StackedWithLineChart
          monthlyData={monthlyData}
          summaries={summaries}
          height={400}
        />
      </div>

      {/* Secondary Charts - Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Claims by Category
          </h3>
          <TopCategoriesChart
            categories={categoryTotals.slice(0, 8)}
            height={350}
          />
        </div>

        {/* High-Cost Claimants or Loss Ratio Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {highCostClaimants.length > 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Top Claimants (High-Cost Members)
              </h3>
              <TopClaimantsChart
                claimants={topClaimants}
                height={350}
              />
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Loss Ratio Trend
              </h3>
              <LossRatioTrendChart
                summaries={summaries}
                height={350}
              />
            </>
          )}
        </div>
      </div>

      {highCostClaimants.length > 0 && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <HighCostTable claimants={highCostClaimants} />
          <DiagnosisBreakdownChart
            categories={diagnosisCategories}
            distribution={costDistribution}
          />
        </div>
      )}
    </div>
  )
}
