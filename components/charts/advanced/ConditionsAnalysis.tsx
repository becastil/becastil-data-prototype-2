'use client'

import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import MetricTile from './tiles/MetricTile'
import type { ConditionsData } from '@/lib/utils/chartData'
import { formatCurrency, formatPercentage } from '@/lib/utils/chartData'

interface ConditionsAnalysisProps {
  data: ConditionsData[]
  className?: string
}

export default function ConditionsAnalysis({ 
  data, 
  className = '' 
}: ConditionsAnalysisProps) {
  
  const [selectedCondition, setSelectedCondition] = useState<ConditionsData | null>(null)

  const metrics = useMemo(() => {
    if (data.length === 0) return null

    const totalMembers = data.reduce((sum, item) => sum + item.memberCount, 0)
    const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0)
    const avgCostPerCondition = data.length > 0 ? totalCost / data.length : 0

    // Find top condition
    const topCondition = data[0] || { condition: 'N/A', totalCost: 0, memberCount: 0, avgCostPerMember: 0, percentage: 0, subcategories: [] }

    // Find most costly per member condition
    const highestPerMemberCondition = data.reduce((max, item) => 
      item.avgCostPerMember > max.avgCostPerMember ? item : max, topCondition)

    // Calculate condition concentration (top 3)
    const top3Cost = data.slice(0, 3).reduce((sum, item) => sum + item.totalCost, 0)
    const concentration = totalCost > 0 ? (top3Cost / totalCost) * 100 : 0

    return {
      totalMembers,
      totalCost,
      avgCostPerCondition,
      topCondition,
      highestPerMemberCondition,
      concentration,
      totalConditions: data.length
    }
  }, [data])

  const mainChartOption = useMemo((): EChartsOption => {
    if (data.length === 0) return {}

    const displayData = data.slice(0, 8) // Show top 8 conditions

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const dataIndex = params[0]?.dataIndex
          if (dataIndex === undefined) return ''
          
          const item = displayData[dataIndex]
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px;">${item.condition}</div>
              <div style="margin-bottom: 4px;">Members: ${item.memberCount.toLocaleString()}</div>
              <div style="margin-bottom: 4px;">Total Cost: ${formatCurrency(item.totalCost)}</div>
              <div style="margin-bottom: 4px;">% of Total: ${formatPercentage(item.percentage)}</div>
              <div>Avg Cost/Member: ${formatCurrency(item.avgCostPerMember)}</div>
            </div>
          `
        }
      },
      legend: {
        data: ['Total Cost', 'Member Count'],
        top: 20,
        textStyle: {
          fontSize: 12,
          color: '#6b7280'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '25%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: displayData.map(item => {
          // Truncate long condition names
          return item.condition.length > 20 ? item.condition.substring(0, 20) + '...' : item.condition
        }),
        axisLabel: {
          fontSize: 10,
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
          name: 'Total Cost ($)',
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
        {
          type: 'value',
          name: 'Members',
          nameTextStyle: {
            fontSize: 11,
            color: '#6b7280'
          },
          axisLabel: {
            fontSize: 11,
            color: '#6b7280',
            formatter: (value: number) => value.toLocaleString()
          },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Total Cost',
          type: 'bar',
          yAxisIndex: 0,
          data: displayData.map(item => item.totalCost),
          itemStyle: {
            color: '#3b82f6'
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'Member Count',
          type: 'line',
          yAxisIndex: 1,
          data: displayData.map(item => item.memberCount),
          itemStyle: {
            color: '#f59e0b'
          },
          lineStyle: {
            width: 2
          },
          symbol: 'circle',
          symbolSize: 6
        }
      ]
    }
  }, [data])

  const subcategoryChartOption = useMemo((): EChartsOption => {
    if (!selectedCondition || selectedCondition.subcategories.length === 0) return {}

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const item = selectedCondition.subcategories[params.dataIndex]
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px;">${item.name}</div>
              <div style="margin-bottom: 4px;">Cost: ${formatCurrency(item.cost)}</div>
              <div>% of ${selectedCondition.condition}: ${formatPercentage(item.percentage)}</div>
            </div>
          `
        }
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data: selectedCondition.subcategories.map(sub => ({
            name: sub.name.length > 25 ? sub.name.substring(0, 25) + '...' : sub.name,
            value: sub.cost
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            fontSize: 10,
            formatter: '{b}\n{d}%'
          }
        }
      ]
    }
  }, [selectedCondition])

  if (data.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <p>No data available for Conditions analysis</p>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Total Conditions"
          value={metrics.totalConditions.toString()}
          subtitle="Diagnosed conditions"
          color="primary"
        />
        <MetricTile
          title="Top Condition"
          value={formatPercentage(metrics.topCondition.percentage)}
          subtitle={metrics.topCondition.condition.length > 15 ? 
            metrics.topCondition.condition.substring(0, 15) + '...' : 
            metrics.topCondition.condition}
          color="error"
        />
        <MetricTile
          title="Cost Concentration"
          value={formatPercentage(metrics.concentration)}
          subtitle="Top 3 conditions"
          color="warning"
        />
        <MetricTile
          title="Avg Cost/Condition"
          value={metrics.avgCostPerCondition}
          subtitle="Per condition category"
          color="neutral"
        />
      </div>

      {/* Main Conditions Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Conditions by Cost</h3>
          <p className="text-sm text-gray-600">
            Healthcare conditions ranked by total cost and member count
          </p>
        </div>
        <div style={{ height: '400px' }}>
          <ReactECharts
            option={mainChartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>

      {/* Condition Selection and Subcategory Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condition Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Condition Details</h3>
            <p className="text-sm text-gray-600">
              Select a condition to view subcategory breakdown
            </p>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.slice(0, 10).map((condition, index) => (
              <button
                key={condition.condition}
                onClick={() => setSelectedCondition(condition)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedCondition?.condition === condition.condition
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      #{index + 1} {condition.condition}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {condition.memberCount} members • {formatCurrency(condition.totalCost)}
                    </div>
                  </div>
                  <div className="ml-2 text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPercentage(condition.percentage)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(condition.avgCostPerMember)}/member
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Subcategory Analysis */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Subcategory Breakdown</h3>
            <p className="text-sm text-gray-600">
              {selectedCondition ? 
                `Detailed breakdown of ${selectedCondition.condition}` :
                'Select a condition to view subcategories'
              }
            </p>
          </div>
          
          {selectedCondition ? (
            <div>
              <div style={{ height: '250px' }}>
                <ReactECharts
                  option={subcategoryChartOption}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
              
              {/* Subcategory List */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-800">Top Subcategories</h4>
                {selectedCondition.subcategories.slice(0, 5).map((sub, index) => (
                  <div key={sub.name} className="flex justify-between items-center text-xs">
                    <span className="text-gray-700 truncate flex-1 mr-2">
                      {index + 1}. {sub.name}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatPercentage(sub.percentage)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">Select a condition to view breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Conditions Summary</h3>
          <p className="text-sm text-gray-600">
            Complete breakdown of healthcare conditions and associated costs
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-900">Rank</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-900">Condition</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-900">Members</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900">Total Cost</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-900">% of Total</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900">Avg/Member</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 8).map((item, index) => (
                <tr 
                  key={item.condition} 
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    selectedCondition?.condition === item.condition ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedCondition(item)}
                >
                  <td className="py-3 px-2">
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-red-100 text-red-800' :
                      index === 1 ? 'bg-orange-100 text-orange-800' :
                      index === 2 ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-900 text-sm">
                      {item.condition.length > 40 ? item.condition.substring(0, 40) + '...' : item.condition}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="font-semibold text-gray-900">{item.memberCount}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(item.totalCost)}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-gray-700">{formatPercentage(item.percentage, 1)}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(item.avgCostPerMember)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}