'use client'

import { useMemo } from 'react'
import MetricTile from './tiles/MetricTile'
import type { CostDriverData } from '@/lib/utils/chartData'
import { formatCurrency, formatPercentage } from '@/lib/utils/chartData'

interface CostDriversTableProps {
  data: CostDriverData[]
  className?: string
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
  switch (trend) {
    case 'up':
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17l9.2-9.2M17 17V7M17 7H7" />
        </svg>
      )
    case 'down':
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 7l-9.2 9.2M7 7v10M7 7h10" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
        </svg>
      )
  }
}

const ProgressBar = ({ percentage, color = 'blue' }: { percentage: number; color?: string }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  }

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  )
}

export default function CostDriversTable({ 
  data, 
  className = '' 
}: CostDriversTableProps) {
  
  const metrics = useMemo(() => {
    if (data.length === 0) return null

    const totalCost = data.reduce((sum, item) => sum + item.amount, 0)
    const topDriver = data[0]
    const categoriesIncreasing = data.filter(item => item.trend === 'up').length
    const categoriesDecreasing = data.filter(item => item.trend === 'down').length
    
    // Calculate cost concentration (top 3 categories)
    const top3Cost = data.slice(0, 3).reduce((sum, item) => sum + item.amount, 0)
    const concentration = totalCost > 0 ? (top3Cost / totalCost) * 100 : 0

    return {
      totalCost,
      topDriver,
      categoriesIncreasing,
      categoriesDecreasing,
      concentration,
      totalCategories: data.length
    }
  }, [data])

  // Sort data by amount (highest first) and take top 10
  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [data])

  if (data.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <p>No data available for Cost Drivers analysis</p>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Total Cost"
          value={metrics.totalCost}
          subtitle="All categories combined"
          color="primary"
        />
        <MetricTile
          title="Top Driver"
          value={formatPercentage(metrics.topDriver?.percentage || 0)}
          subtitle={metrics.topDriver?.category || 'N/A'}
          color="warning"
        />
        <MetricTile
          title="Top 3 Concentration"
          value={formatPercentage(metrics.concentration)}
          subtitle="Share of top 3 categories"
          color="neutral"
        />
        <MetricTile
          title="Trend Status"
          value={`${metrics.categoriesIncreasing}↑ ${metrics.categoriesDecreasing}↓`}
          subtitle="Categories increasing/decreasing"
          trend={metrics.categoriesIncreasing > metrics.categoriesDecreasing ? 'up' : 
                 metrics.categoriesIncreasing < metrics.categoriesDecreasing ? 'down' : 'neutral'}
          color={metrics.categoriesIncreasing > metrics.categoriesDecreasing ? 'error' : 'success'}
        />
      </div>

      {/* Cost Drivers Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cost Drivers Analysis</h3>
          <p className="text-sm text-gray-600">
            Categories ranked by total cost with distribution and trend indicators
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-900">Rank</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-900">Category</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900">Amount</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-900">% of Total</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-900">Distribution</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-900">Change</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-900">Trend</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr 
                  key={item.category} 
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    index < 3 ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-900 text-sm">
                      {item.category}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="font-semibold text-gray-900 text-sm">
                      {formatCurrency(item.amount)}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="font-semibold text-gray-900 text-sm">
                      {formatPercentage(item.percentage, 1)}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <ProgressBar 
                        percentage={item.percentage} 
                        color={
                          index === 0 ? 'red' :
                          index < 3 ? 'amber' :
                          index < 5 ? 'blue' : 'green'
                        }
                      />
                      <span className="text-xs text-gray-500 min-w-[3rem]">
                        {formatPercentage(item.percentage, 1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className={`text-sm font-semibold ${
                      item.changeFromPrevious > 0 ? 'text-red-600' :
                      item.changeFromPrevious < 0 ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {item.changeFromPrevious > 0 ? '+' : ''}
                      {formatPercentage(item.changeFromPrevious, 1)}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex justify-center">
                      <TrendIcon trend={item.trend} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Key Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-600">
            <div>
              • Top category: {metrics.topDriver?.category} ({formatPercentage(metrics.topDriver?.percentage || 0)})
            </div>
            <div>
              • Categories increasing: {metrics.categoriesIncreasing} of {metrics.totalCategories}
            </div>
            <div>
              • Cost concentration: {formatPercentage(metrics.concentration)} in top 3
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}