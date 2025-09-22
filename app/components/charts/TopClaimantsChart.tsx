'use client'

import { useState, useEffect } from 'react'
import ChartContainer from './ChartContainer'

interface TopClaimantsChartProps {
  data?: any
  theme?: 'professional' | 'accessible' | 'dark'
  height?: number
  className?: string
}

export default function TopClaimantsChart({ 
  data,
  theme = 'professional',
  height = 400,
  className 
}: TopClaimantsChartProps) {
  const [chartConfig, setChartConfig] = useState<any>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChartConfig = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/charts/render?type=top-claimants&theme=${theme}`)
        const result = await response.json()

        if (result.success) {
          setChartConfig(result.config)
          setChartData(result.data)
        } else {
          setError(result.message || 'Failed to load chart configuration')
        }
      } catch (err) {
        setError('Failed to fetch chart data')
        console.error('Chart fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchChartConfig()
  }, [theme])

  // Get bar color based on theme
  const getBarColor = (theme: string) => {
    switch (theme) {
      case 'accessible':
        return '#1f2937'
      case 'dark':
        return '#60a5fa'
      default:
        return '#2563eb'
    }
  }

  // Placeholder chart implementation (will be replaced with actual Chart.js once installed)
  const renderChart = () => {
    if (!chartData || !chartConfig) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Top Claimants Chart</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Chart.js rendering pending installation</p>
          </div>
        </div>
      )
    }

    const claimantData = chartData.datasets?.[0]?.data || []
    const labels = chartData.labels || []
    const maxValue = Math.max(...claimantData)
    const barColor = getBarColor(theme)

    return (
      <div className="h-full flex flex-col">
        {/* Chart area */}
        <div className="flex-1 flex">
          {/* Y-axis labels */}
          <div className="w-16 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 py-4">
            <span>${Math.round(maxValue / 1000)}k</span>
            <span>${Math.round(maxValue / 2000)}k</span>
            <span>$0</span>
          </div>

          {/* Bars */}
          <div className="flex-1 flex items-end gap-2 py-4 pr-4">
            {claimantData.map((value: number, index: number) => {
              const height = (value / maxValue) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div 
                    className="w-full rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                    style={{ 
                      height: `${height}%`, 
                      minHeight: '4px',
                      backgroundColor: barColor
                    }}
                    title={`${labels[index]}: $${value.toLocaleString()}`}
                  />
                  
                  {/* Value label on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap absolute z-10 transform -translate-y-full">
                    ${(value / 1000).toFixed(0)}k
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-16 mr-4 flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          {labels.map((label: string, index: number) => (
            <span key={index} className="text-center flex-1 truncate px-1" title={label}>
              {label}
            </span>
          ))}
        </div>

        {/* Summary statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {labels.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Claimants</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ${Math.round(claimantData.reduce((sum: number, val: number) => sum + val, 0) / 1000)}k
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Cost</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ${Math.round((claimantData.reduce((sum: number, val: number) => sum + val, 0) / claimantData.length) / 1000)}k
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Cost</div>
          </div>
        </div>

        {/* Data table for accessibility */}
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            View Detailed Data
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-1 text-gray-600 dark:text-gray-300">Claimant</th>
                  <th className="text-right py-1 text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="text-right py-1 text-gray-600 dark:text-gray-300">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {labels.map((label: string, index: number) => {
                  const value = claimantData[index]
                  const total = claimantData.reduce((sum: number, val: number) => sum + val, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-1 text-gray-900 dark:text-gray-100">{label}</td>
                      <td className="py-1 text-right text-gray-900 dark:text-gray-100">
                        ${value.toLocaleString()}
                      </td>
                      <td className="py-1 text-right text-gray-500 dark:text-gray-400">
                        {percentage}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </details>

        {/* Chart configuration preview */}
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            View Chart Configuration
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify({ config: chartConfig, data: chartData }, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <ChartContainer
      title="Top Cost Drivers"
      description="Highest-cost claimants and their impact on total healthcare spending"
      loading={loading}
      error={error}
      height={height}
      exportable={true}
      chartType="top-claimants"
      theme={theme}
      className={className}
    >
      {renderChart()}
    </ChartContainer>
  )
}