'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import MetricTile from './tiles/MetricTile'
import type { PremiumClaimsData } from '@/lib/utils/chartData'
import { formatCurrency, formatPercentage } from '@/lib/utils/chartData'

interface PremiumClaimsSectionProps {
  data: PremiumClaimsData[]
  className?: string
}

export default function PremiumClaimsSection({ 
  data, 
  className = '' 
}: PremiumClaimsSectionProps) {
  
  const metrics = useMemo(() => {
    if (data.length === 0) return null

    const totalPremium = data.reduce((sum, item) => sum + item.premium, 0)
    const totalMedicalClaims = data.reduce((sum, item) => sum + item.medicalClaims, 0)
    const totalRxClaims = data.reduce((sum, item) => sum + item.rxClaims, 0)
    const totalClaims = totalMedicalClaims + totalRxClaims

    const overallRatio = totalPremium > 0 ? (totalClaims / totalPremium) * 100 : 0
    const medicalPortion = totalClaims > 0 ? (totalMedicalClaims / totalClaims) * 100 : 0
    const rxPortion = totalClaims > 0 ? (totalRxClaims / totalClaims) * 100 : 0

    // Calculate monthly averages
    const avgMonthlyPremium = data.length > 0 ? totalPremium / data.length : 0
    const avgMonthlyClaims = data.length > 0 ? totalClaims / data.length : 0

    // Calculate trends (comparing last 3 vs previous 3 months)
    const recentPeriod = data.slice(-3)
    const previousPeriod = data.slice(-6, -3)
    
    const recentAvgRatio = recentPeriod.length > 0
      ? recentPeriod.reduce((sum, item) => sum + item.ratio, 0) / recentPeriod.length
      : 0
    const previousAvgRatio = previousPeriod.length > 0
      ? previousPeriod.reduce((sum, item) => sum + item.ratio, 0) / previousPeriod.length
      : 0

    const ratioTrend = previousAvgRatio > 0 
      ? ((recentAvgRatio - previousAvgRatio) / previousAvgRatio) * 100 
      : 0

    // Premium vs claims surplus/deficit
    const surplus = totalPremium - totalClaims

    return {
      totalPremium,
      totalClaims,
      overallRatio,
      medicalPortion,
      rxPortion,
      avgMonthlyPremium,
      avgMonthlyClaims,
      ratioTrend,
      surplus
    }
  }, [data])

  const chartOption = useMemo((): EChartsOption => {
    if (data.length === 0) return {}

    const months = data.map(item => {
      const [year, month] = item.month.split('-')
      return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
    })

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const dataIndex = params[0]?.dataIndex
          if (dataIndex === undefined) return ''
          
          const monthData = data[dataIndex]
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px;">${months[dataIndex]}</div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #10b981; margin-right: 8px; border-radius: 2px;"></div>
                <span>Premium: ${formatCurrency(monthData.premium)}</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #3b82f6; margin-right: 8px; border-radius: 2px;"></div>
                <span>Medical Claims: ${formatCurrency(monthData.medicalClaims)}</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #f59e0b; margin-right: 8px; border-radius: 2px;"></div>
                <span>Rx Claims: ${formatCurrency(monthData.rxClaims)}</span>
              </div>
              <div style="border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 4px;">
                <span style="font-weight: 600;">Total Claims: ${formatCurrency(monthData.totalClaims)}</span><br/>
                <span style="color: ${monthData.ratio > 100 ? '#ef4444' : '#10b981'};">
                  Claims Ratio: ${formatPercentage(monthData.ratio)}
                </span>
              </div>
            </div>
          `
        }
      },
      legend: {
        data: ['Premium', 'Medical Claims', 'Rx Claims'],
        top: 20,
        textStyle: {
          fontSize: 12,
          color: '#6b7280'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          fontSize: 11,
          color: '#6b7280',
          rotate: 45
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Amount ($)',
        nameTextStyle: {
          fontSize: 11,
          color: '#6b7280'
        },
        axisLabel: {
          fontSize: 11,
          color: '#6b7280',
          formatter: (value: number) => {
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
            return `$${value.toFixed(0)}`
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'Premium',
          type: 'bar',
          data: data.map(item => item.premium),
          itemStyle: {
            color: '#10b981'
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'Medical Claims',
          type: 'bar',
          data: data.map(item => item.medicalClaims),
          itemStyle: {
            color: '#3b82f6'
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'Rx Claims',
          type: 'bar',
          data: data.map(item => item.rxClaims),
          itemStyle: {
            color: '#f59e0b'
          },
          emphasis: {
            focus: 'series'
          }
        }
      ]
    }
  }, [data])

  // Secondary chart for claims ratio trend
  const ratioChartOption = useMemo((): EChartsOption => {
    if (data.length === 0) return {}

    const months = data.map(item => {
      const [year, month] = item.month.split('-')
      return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
        month: 'short'
      })
    })

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const dataIndex = params[0]?.dataIndex
          if (dataIndex === undefined) return ''
          
          const monthData = data[dataIndex]
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px;">${months[dataIndex]}</div>
              <div>Claims Ratio: ${formatPercentage(monthData.ratio)}</div>
            </div>
          `
        }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '20%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          fontSize: 10,
          color: '#6b7280'
        }
      },
      yAxis: {
        type: 'value',
        name: 'Ratio (%)',
        nameTextStyle: {
          fontSize: 10,
          color: '#6b7280'
        },
        axisLabel: {
          fontSize: 10,
          color: '#6b7280',
          formatter: '{value}%'
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          type: 'line',
          data: data.map(item => item.ratio),
          itemStyle: {
            color: '#8b5cf6'
          },
          lineStyle: {
            width: 2
          },
          symbol: 'circle',
          symbolSize: 4,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
              ]
            }
          }
        }
      ]
    }
  }, [data])

  if (data.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <p>No data available for Premium vs Claims analysis</p>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Total Premium"
          value={metrics.totalPremium}
          subtitle="Collected premiums"
          color="success"
        />
        <MetricTile
          title="Total Claims"
          value={metrics.totalClaims}
          subtitle="Medical + Pharmacy"
          color="primary"
        />
        <MetricTile
          title="Claims Ratio"
          value={formatPercentage(metrics.overallRatio)}
          subtitle="Claims as % of premium"
          change={Math.abs(metrics.ratioTrend)}
          trend={metrics.ratioTrend > 1 ? 'up' : metrics.ratioTrend < -1 ? 'down' : 'neutral'}
          color={metrics.overallRatio > 100 ? 'error' : metrics.overallRatio > 80 ? 'warning' : 'success'}
        />
        <MetricTile
          title="Net Position"
          value={metrics.surplus}
          subtitle={metrics.surplus >= 0 ? 'Premium surplus' : 'Claims deficit'}
          color={metrics.surplus >= 0 ? 'success' : 'error'}
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Premium vs Claims Comparison</h3>
          <p className="text-sm text-gray-600">
            Monthly premium collections compared to medical and pharmacy claims
          </p>
        </div>
        <div style={{ height: '350px' }}>
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>

      {/* Claims Breakdown and Ratio Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Claims Breakdown</h3>
            <p className="text-xs text-gray-600">Medical vs Pharmacy distribution</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-700">Medical Claims</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{formatPercentage(metrics.medicalPortion)}</div>
                <div className="text-xs text-gray-500">{formatCurrency(metrics.totalClaims * (metrics.medicalPortion / 100))}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded"></div>
                <span className="text-sm text-gray-700">Pharmacy Claims</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{formatPercentage(metrics.rxPortion)}</div>
                <div className="text-xs text-gray-500">{formatCurrency(metrics.totalClaims * (metrics.rxPortion / 100))}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span>Monthly Avg Premium:</span>
                <span className="font-semibold">{formatCurrency(metrics.avgMonthlyPremium)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Monthly Avg Claims:</span>
                <span className="font-semibold">{formatCurrency(metrics.avgMonthlyClaims)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Claims Ratio Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Claims Ratio Trend</h3>
            <p className="text-xs text-gray-600">Monthly claims as percentage of premium</p>
          </div>
          <div style={{ height: '200px' }}>
            <ReactECharts
              option={ratioChartOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}