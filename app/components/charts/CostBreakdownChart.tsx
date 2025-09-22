'use client'

import { useState, useEffect } from 'react'
import ChartContainer from './ChartContainer'

interface CostBreakdownChartProps {
  data?: any
  theme?: 'professional' | 'accessible' | 'dark'
  height?: number
  className?: string
}

export default function CostBreakdownChart({ 
  data,
  theme = 'professional',
  height = 400,
  className 
}: CostBreakdownChartProps) {
  const [chartConfig, setChartConfig] = useState<any>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChartConfig = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/charts/render?type=service-breakdown&theme=${theme}`)
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

  // Color palette for different themes
  const getColors = (theme: string) => {
    switch (theme) {
      case 'accessible':
        return ['#1f2937', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2']
      case 'dark':
        return ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#22d3ee']
      default:
        return ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777']
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cost Breakdown Chart</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Chart.js rendering pending installation</p>
          </div>
        </div>
      )
    }

    const serviceData = chartData.datasets?.[0]?.data || []
    const labels = chartData.labels || []
    const colors = getColors(theme)
    const total = serviceData.reduce((sum: number, value: number) => sum + value, 0)

    return (
      <div className="h-full flex">
        {/* Donut chart representation */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-48 h-48">
            {/* Outer ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {serviceData.map((value: number, index: number) => {
                const percentage = (value / total) * 100
                const circumference = 2 * Math.PI * 35
                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
                const strokeDashoffset = -serviceData
                  .slice(0, index)
                  .reduce((sum: number, val: number) => sum + val, 0) / total * circumference

                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke={colors[index % colors.length]}
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all hover:stroke-opacity-80"
                  />
                )
              })}
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ${(total / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="w-48 flex flex-col justify-center gap-3 pl-4">
          {labels.map((label: string, index: number) => {
            const value = serviceData[index]
            const percentage = ((value / total) * 100).toFixed(1)
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ${(value / 1000).toFixed(0)}k ({percentage}%)
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <ChartContainer
      title="Cost Breakdown by Service Type"
      description="Distribution of healthcare spending across different service categories"
      loading={loading}
      error={error}
      height={height}
      exportable={true}
      chartType="service-breakdown"
      theme={theme}
      className={className}
    >
      {renderChart()}
    </ChartContainer>
  )
}