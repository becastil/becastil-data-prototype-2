'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import MetricTile from './tiles/MetricTile'
import type { LossRatioData } from '@/lib/utils/chartData'
import { formatCurrency, formatPercentage } from '@/lib/utils/chartData'

interface LossRatioTrendSectionProps {
  data: LossRatioData[]
  className?: string
}

export default function LossRatioTrendSection({ 
  data, 
  className = '' 
}: LossRatioTrendSectionProps) {
  
  const metrics = useMemo(() => {
    if (data.length === 0) return null

    const latestData = data[data.length - 1]
    const totalPremium = data.reduce((sum, item) => sum + item.premium, 0)
    const totalClaims = data.reduce((sum, item) => sum + item.claims, 0)
    const overallLossRatio = totalPremium > 0 ? (totalClaims / totalPremium) * 100 : 0

    // Calculate trend (comparing last 3 months vs previous 3 months)
    const recentPeriod = data.slice(-3)
    const previousPeriod = data.slice(-6, -3)
    
    const recentAvgLossRatio = recentPeriod.length > 0
      ? recentPeriod.reduce((sum, item) => sum + item.lossRatio, 0) / recentPeriod.length
      : 0
    const previousAvgLossRatio = previousPeriod.length > 0
      ? previousPeriod.reduce((sum, item) => sum + item.lossRatio, 0) / previousPeriod.length
      : 0

    const trendPercent = previousAvgLossRatio > 0 
      ? ((recentAvgLossRatio - previousAvgLossRatio) / previousAvgLossRatio) * 100 
      : 0

    // Performance vs benchmarks
    const targetLossRatio = 80 // Industry benchmark
    const performanceVsTarget = overallLossRatio - targetLossRatio

    // Months above/below 100%
    const monthsAbove100 = data.filter(item => item.lossRatio > 100).length
    const monthsBelow80 = data.filter(item => item.lossRatio < 80).length

    return {
      currentLossRatio: latestData?.lossRatio || 0,
      currentR12LossRatio: latestData?.r12LossRatio || 0,
      overallLossRatio,
      trendPercent,
      performanceVsTarget,
      monthsAbove100,
      monthsBelow80,
      totalMonths: data.length
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
          type: 'cross'
        },
        formatter: (params: any) => {
          const dataIndex = params[0]?.dataIndex
          if (dataIndex === undefined) return ''
          
          const monthData = data[dataIndex]
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px;">${months[dataIndex]}</div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #3b82f6; margin-right: 8px; border-radius: 2px;"></div>
                <span>Monthly Loss Ratio: ${formatPercentage(monthData.lossRatio)}</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #f59e0b; margin-right: 8px; border-radius: 2px;"></div>
                <span>12-Month Rolling: ${formatPercentage(monthData.r12LossRatio)}</span>
              </div>
              <div style="border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 4px;">
                <span>Premium: ${formatCurrency(monthData.premium)}</span><br/>
                <span>Claims: ${formatCurrency(monthData.claims)}</span>
              </div>
            </div>
          `
        }
      },
      legend: {
        data: ['Monthly Loss Ratio', '12-Month Rolling', '80% Target', '100% Break-even'],
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
        name: 'Loss Ratio (%)',
        nameTextStyle: {
          fontSize: 11,
          color: '#6b7280'
        },
        axisLabel: {
          fontSize: 11,
          color: '#6b7280',
          formatter: '{value}%'
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        },
        min: 0,
        max: (value: any) => Math.max(120, Math.ceil(value.max / 10) * 10)
      },
      series: [
        {
          name: 'Monthly Loss Ratio',
          type: 'line',
          data: data.map(item => item.lossRatio),
          itemStyle: {
            color: '#3b82f6'
          },
          lineStyle: {
            width: 2
          },
          symbol: 'circle',
          symbolSize: 6,
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: '12-Month Rolling',
          type: 'line',
          data: data.map(item => item.r12LossRatio),
          itemStyle: {
            color: '#f59e0b'
          },
          lineStyle: {
            width: 3,
            type: 'solid'
          },
          symbol: 'circle',
          symbolSize: 4,
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: '80% Target',
          type: 'line',
          data: new Array(data.length).fill(80),
          itemStyle: {
            color: '#10b981'
          },
          lineStyle: {
            width: 2,
            type: 'dashed'
          },
          symbol: 'none',
          silent: true
        },
        {
          name: '100% Break-even',
          type: 'line',
          data: new Array(data.length).fill(100),
          itemStyle: {
            color: '#ef4444'
          },
          lineStyle: {
            width: 2,
            type: 'dashed'
          },
          symbol: 'none',
          silent: true
        }
      ]
    }
  }, [data])

  if (data.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <p>No data available for Loss Ratio analysis</p>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Current Loss Ratio"
          value={formatPercentage(metrics.currentLossRatio)}
          subtitle="Latest month"
          change={Math.abs(metrics.trendPercent)}
          trend={metrics.trendPercent > 1 ? 'up' : metrics.trendPercent < -1 ? 'down' : 'neutral'}
          color={metrics.currentLossRatio > 100 ? 'error' : metrics.currentLossRatio < 80 ? 'success' : 'warning'}
        />
        <MetricTile
          title="12-Month Rolling"
          value={formatPercentage(metrics.currentR12LossRatio)}
          subtitle="Rolling average"
          color={metrics.currentR12LossRatio > 100 ? 'error' : metrics.currentR12LossRatio < 80 ? 'success' : 'warning'}
        />
        <MetricTile
          title="vs 80% Target"
          value={`${metrics.performanceVsTarget >= 0 ? '+' : ''}${formatPercentage(metrics.performanceVsTarget, 1)}`}
          subtitle="Performance vs benchmark"
          trend={metrics.performanceVsTarget > 5 ? 'up' : metrics.performanceVsTarget < -5 ? 'down' : 'neutral'}
          color={metrics.performanceVsTarget > 10 ? 'error' : metrics.performanceVsTarget < -10 ? 'success' : 'warning'}
        />
        <MetricTile
          title="Months >100%"
          value={`${metrics.monthsAbove100}/${metrics.totalMonths}`}
          subtitle="Loss ratio above break-even"
          color={metrics.monthsAbove100 > metrics.totalMonths * 0.5 ? 'error' : 'neutral'}
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Loss Ratio Trend Analysis</h3>
          <p className="text-sm text-gray-600">
            Monthly and 12-month rolling loss ratios with industry benchmarks
          </p>
        </div>
        <div style={{ height: '400px' }}>
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
        
        {/* Key Insights */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Key Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              • Target: Loss ratios below 80% indicate strong performance
            </div>
            <div>
              • Break-even: Loss ratios above 100% indicate losses
            </div>
            <div>
              • Months below 80%: {metrics.monthsBelow80} of {metrics.totalMonths}
            </div>
            <div>
              • Trend: {metrics.trendPercent > 0 ? 'Worsening' : metrics.trendPercent < 0 ? 'Improving' : 'Stable'} 
              ({metrics.trendPercent > 0 ? '+' : ''}{formatPercentage(metrics.trendPercent, 1)})
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}