'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import MetricTile from './tiles/MetricTile'
import type { MemberDistributionData } from '@/lib/utils/chartData'
import { formatCurrency, formatPercentage } from '@/lib/utils/chartData'

interface MemberDistributionChartProps {
  data: MemberDistributionData[]
  className?: string
}

export default function MemberDistributionChart({ 
  data, 
  className = '' 
}: MemberDistributionChartProps) {
  
  const metrics = useMemo(() => {
    if (data.length === 0) return null

    const totalMembers = data.reduce((sum, item) => sum + item.memberCount, 0)
    const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0)
    const avgCostPerMember = totalMembers > 0 ? totalCost / totalMembers : 0

    // Find highest cost age group
    const highestCostGroup = data.reduce((max, item) => 
      item.totalCost > max.totalCost ? item : max, data[0] || { ageRange: 'N/A', totalCost: 0, memberCount: 0, avgCostPerMember: 0, percentage: 0 })

    // Find most costly per member age group
    const highestPerMemberGroup = data.reduce((max, item) => 
      item.avgCostPerMember > max.avgCostPerMember ? item : max, data[0] || { ageRange: 'N/A', totalCost: 0, memberCount: 0, avgCostPerMember: 0, percentage: 0 })

    // Find largest member group
    const largestMemberGroup = data.reduce((max, item) => 
      item.memberCount > max.memberCount ? item : max, data[0] || { ageRange: 'N/A', totalCost: 0, memberCount: 0, avgCostPerMember: 0, percentage: 0 })

    return {
      totalMembers,
      totalCost,
      avgCostPerMember,
      highestCostGroup,
      highestPerMemberGroup,
      largestMemberGroup
    }
  }, [data])

  const memberCountChartOption = useMemo((): EChartsOption => {
    if (data.length === 0) return {}

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const dataIndex = params[0]?.dataIndex
          if (dataIndex === undefined) return ''
          
          const item = data[dataIndex]
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px;">Age Range: ${item.ageRange}</div>
              <div style="margin-bottom: 4px;">Members: ${item.memberCount.toLocaleString()}</div>
              <div style="margin-bottom: 4px;">Percentage: ${formatPercentage(item.percentage)}</div>
              <div style="margin-bottom: 4px;">Total Cost: ${formatCurrency(item.totalCost)}</div>
              <div>Avg Cost/Member: ${formatCurrency(item.avgCostPerMember)}</div>
            </div>
          `
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.ageRange),
        axisLabel: {
          fontSize: 11,
          color: '#6b7280'
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Member Count',
        nameTextStyle: {
          fontSize: 11,
          color: '#6b7280'
        },
        axisLabel: {
          fontSize: 11,
          color: '#6b7280',
          formatter: (value: number) => value.toLocaleString()
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
          type: 'bar',
          data: data.map(item => item.memberCount),
          itemStyle: {
            color: '#3b82f6'
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#1d4ed8'
            }
          }
        }
      ]
    }
  }, [data])

  const costDistributionChartOption = useMemo((): EChartsOption => {
    if (data.length === 0) return {}

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const dataIndex = params[0]?.dataIndex
          if (dataIndex === undefined) return ''
          
          const item = data[dataIndex]
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px;">Age Range: ${item.ageRange}</div>
              <div style="margin-bottom: 4px;">Total Cost: ${formatCurrency(item.totalCost)}</div>
              <div style="margin-bottom: 4px;">Members: ${item.memberCount.toLocaleString()}</div>
              <div>Avg Cost/Member: ${formatCurrency(item.avgCostPerMember)}</div>
            </div>
          `
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.ageRange),
        axisLabel: {
          fontSize: 11,
          color: '#6b7280'
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: {
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
      series: [
        {
          type: 'bar',
          data: data.map(item => item.totalCost),
          itemStyle: {
            color: '#f59e0b'
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#d97706'
            }
          }
        }
      ]
    }
  }, [data])

  if (data.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <p>No data available for Member Distribution analysis</p>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          title="Total Members"
          value={metrics.totalMembers.toLocaleString()}
          subtitle="High-cost claimants"
          color="primary"
        />
        <MetricTile
          title="Highest Cost Group"
          value={metrics.highestCostGroup.ageRange}
          subtitle={formatCurrency(metrics.highestCostGroup.totalCost)}
          color="error"
        />
        <MetricTile
          title="Costliest Per Member"
          value={metrics.highestPerMemberGroup.ageRange}
          subtitle={formatCurrency(metrics.highestPerMemberGroup.avgCostPerMember)}
          color="warning"
        />
        <MetricTile
          title="Largest Group"
          value={metrics.largestMemberGroup.ageRange}
          subtitle={`${metrics.largestMemberGroup.memberCount} members`}
          color="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Count Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Member Count by Age</h3>
            <p className="text-sm text-gray-600">
              Distribution of high-cost claimants across age groups
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ReactECharts
              option={memberCountChartOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>

        {/* Cost Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Cost by Age</h3>
            <p className="text-sm text-gray-600">
              Healthcare spending distribution across age groups
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <ReactECharts
              option={costDistributionChartOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Age Group Breakdown</h3>
          <p className="text-sm text-gray-600">
            Detailed analysis of member distribution and cost patterns
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-900">Age Range</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-900">Members</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-900">% of Total</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900">Total Cost</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900">Avg Cost/Member</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-900">Cost Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const isHighestCost = item.ageRange === metrics.highestCostGroup.ageRange
                const isHighestPerMember = item.ageRange === metrics.highestPerMemberGroup.ageRange
                const isLargestGroup = item.ageRange === metrics.largestMemberGroup.ageRange
                
                return (
                  <tr 
                    key={item.ageRange} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      isHighestCost ? 'bg-red-50/30' : 
                      isHighestPerMember ? 'bg-amber-50/30' :
                      isLargestGroup ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{item.ageRange}</span>
                        {isHighestCost && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Highest Cost</span>}
                        {isHighestPerMember && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Highest/Member</span>}
                        {isLargestGroup && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Most Members</span>}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-semibold text-gray-900">{item.memberCount.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-gray-700">{formatPercentage(item.percentage, 1)}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-semibold text-gray-900">{formatCurrency(item.totalCost)}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-semibold text-gray-900">{formatCurrency(item.avgCostPerMember)}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center">
                        {item.avgCostPerMember < metrics.avgCostPerMember ? (
                          <span className="text-green-600 text-sm font-semibold">Efficient</span>
                        ) : item.avgCostPerMember > metrics.avgCostPerMember * 1.5 ? (
                          <span className="text-red-600 text-sm font-semibold">High Cost</span>
                        ) : (
                          <span className="text-gray-600 text-sm font-semibold">Average</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Distribution Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-600">
            <div>
              • Average cost per member: {formatCurrency(metrics.avgCostPerMember)}
            </div>
            <div>
              • Total healthcare spending: {formatCurrency(metrics.totalCost)}
            </div>
            <div>
              • Age groups analyzed: {data.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}