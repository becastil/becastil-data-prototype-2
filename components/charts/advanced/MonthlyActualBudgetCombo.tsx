'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import MetricTile from './tiles/MetricTile'
import type { MonthlyActualBudgetData } from '@/lib/utils/chartData'
import { formatCurrency, formatPercentage } from '@/lib/utils/chartData'

interface MonthlyActualBudgetComboProps {
  data: MonthlyActualBudgetData[]
  className?: string
}

export default function MonthlyActualBudgetCombo({ 
  data, 
  className = '' 
}: MonthlyActualBudgetComboProps) {
  
  const metrics = useMemo(() => {
    if (data.length === 0) return null

    const totalActualExpense = data.reduce((sum, item) => sum + item.actualExpense, 0)
    const totalActualClaims = data.reduce((sum, item) => sum + item.actualClaims, 0)
    const totalBudget = data.reduce((sum, item) => sum + item.budgetTotal, 0)
    const totalVariance = data.reduce((sum, item) => sum + item.variance, 0)

    const totalActual = totalActualExpense + totalActualClaims
    const budgetVariancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0

    // Calculate trends (comparing first half vs second half of data)
    const midpoint = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, midpoint)
    const secondHalf = data.slice(midpoint)
    
    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, item) => sum + item.actualExpense + item.actualClaims, 0) / firstHalf.length
      : 0
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, item) => sum + item.actualExpense + item.actualClaims, 0) / secondHalf.length
      : 0

    const trendPercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0

    return {
      totalActual,
      totalBudget,
      totalVariance,
      budgetVariancePercent,
      trendPercent,
      totalActualExpense,
      totalActualClaims
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
          const totalActual = monthData.actualExpense + monthData.actualClaims
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px;">${months[dataIndex]}</div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #3b82f6; margin-right: 8px; border-radius: 2px;"></div>
                <span>Actual Expense: ${formatCurrency(monthData.actualExpense)}</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #06b6d4; margin-right: 8px; border-radius: 2px;"></div>
                <span>Actual Claims: ${formatCurrency(monthData.actualClaims)}</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background: #f59e0b; margin-right: 8px; border-radius: 2px;"></div>
                <span>Budget Total: ${formatCurrency(monthData.budgetTotal)}</span>
              </div>
              <div style="border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 4px;">
                <span style="font-weight: 600;">Total Actual: ${formatCurrency(totalActual)}</span><br/>
                <span style="color: ${monthData.variance >= 0 ? '#ef4444' : '#10b981'};">
                  Variance: ${monthData.variance >= 0 ? '+' : ''}${formatCurrency(monthData.variance)}
                </span>
              </div>
            </div>
          `
        }
      },
      legend: {
        data: ['Actual Expense', 'Actual Claims', 'Budget Total'],
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
      yAxis: [
        {
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
        }
      ],
      series: [
        {
          name: 'Actual Expense',
          type: 'bar',
          stack: 'actual',
          data: data.map(item => item.actualExpense),
          itemStyle: {
            color: '#3b82f6'
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'Actual Claims',
          type: 'bar',
          stack: 'actual',
          data: data.map(item => item.actualClaims),
          itemStyle: {
            color: '#06b6d4'
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'Budget Total',
          type: 'line',
          data: data.map(item => item.budgetTotal),
          itemStyle: {
            color: '#f59e0b'
          },
          lineStyle: {
            width: 3,
            type: 'solid'
          },
          symbol: 'circle',
          symbolSize: 6,
          emphasis: {
            focus: 'series'
          }
        }
      ]
    }
  }, [data])

  if (data.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <p>No data available for Monthly Actual vs Budget analysis</p>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Total Actual"
          value={metrics.totalActual}
          subtitle="Combined expense + claims"
          change={Math.abs(metrics.trendPercent)}
          trend={metrics.trendPercent > 1 ? 'up' : metrics.trendPercent < -1 ? 'down' : 'neutral'}
          color="primary"
        />
        <MetricTile
          title="Total Budget"
          value={metrics.totalBudget}
          subtitle="Planned spending"
          color="neutral"
        />
        <MetricTile
          title="Budget Variance"
          value={metrics.totalVariance}
          subtitle={`${formatPercentage(Math.abs(metrics.budgetVariancePercent))} of budget`}
          change={Math.abs(metrics.budgetVariancePercent)}
          trend={metrics.totalVariance > 0 ? 'up' : metrics.totalVariance < 0 ? 'down' : 'neutral'}
          color={metrics.totalVariance > 0 ? 'error' : metrics.totalVariance < 0 ? 'success' : 'neutral'}
        />
        <MetricTile
          title="Claims vs Expense"
          value={formatPercentage(
            metrics.totalActual > 0 
              ? (metrics.totalActualClaims / metrics.totalActual) * 100 
              : 0
          )}
          subtitle="Claims portion of total"
          color="warning"
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Actual vs Budget</h3>
          <p className="text-sm text-gray-600">
            Stacked bars show actual expenses and claims vs budgeted amounts
          </p>
        </div>
        <div style={{ height: '400px' }}>
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>
    </div>
  )
}