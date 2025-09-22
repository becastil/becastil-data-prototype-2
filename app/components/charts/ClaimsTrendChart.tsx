'use client'

import { useState, useEffect } from 'react'
import ChartContainer from './ChartContainer'

interface ClaimsTrendChartProps {
  data?: any
  theme?: 'professional' | 'accessible' | 'dark'
  height?: number
  className?: string
}

export default function ClaimsTrendChart({ 
  data,
  theme = 'professional',
  height = 400,
  className 
}: ClaimsTrendChartProps) {
  const [chartConfig, setChartConfig] = useState<any>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChartConfig = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/charts/render?type=claims-trend&theme=${theme}`)
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

  // Placeholder chart implementation (will be replaced with actual Chart.js once installed)
  const renderChart = () => {
    if (!chartData || !chartConfig) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Claims Trend Chart</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Chart.js rendering pending installation</p>
          </div>
        </div>
      )
    }

    // Mock visualization showing the data structure
    const monthlyData = chartData.datasets?.[0]?.data || []
    const labels = chartData.labels || []
    const maxValue = Math.max(...monthlyData)

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 py-4">
            <span>${Math.round(maxValue / 1000)}k</span>
            <span>${Math.round(maxValue / 2000)}k</span>
            <span>$0</span>
          </div>

          {/* Chart area */}
          <div className="ml-12 mr-4 h-full flex items-end gap-1 py-4">
            {monthlyData.map((value: number, index: number) => {
              const height = (value / maxValue) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${height}%`, minHeight: '2px' }}
                    title={`${labels[index]}: $${value.toLocaleString()}`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-12 mr-4 flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          {labels.map((label: string, index: number) => (
            <span key={index} className="text-center flex-1">{label}</span>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-300">Total Amount</span>
          </div>
          {chartData.datasets?.[1] && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-300">Claim Count</span>
            </div>
          )}
        </div>

        {/* Data preview */}
        <details className="mt-4 text-xs">
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
      title="Claims Trend Analysis"
      description="Monthly healthcare costs and claim volumes showing trends over time"
      loading={loading}
      error={error}
      height={height}
      exportable={true}
      chartType="claims-trend"
      theme={theme}
      className={className}
    >
      {renderChart()}
    </ChartContainer>
  )
}