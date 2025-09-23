'use client'

import ReactECharts from 'echarts-for-react'

interface TopClaimantsData {
  claimant: string
  amount: number
  claims: number
}

interface InteractiveTopClaimantsChartProps {
  data?: TopClaimantsData[]
  height?: number
  className?: string
  theme?: 'professional' | 'accessible' | 'dark'
}

const mockData: TopClaimantsData[] = [
  { claimant: 'Patient A', amount: 38500, claims: 9 },
  { claimant: 'Patient B', amount: 32450, claims: 7 },
  { claimant: 'Patient C', amount: 28740, claims: 5 },
  { claimant: 'Patient D', amount: 25890, claims: 8 },
  { claimant: 'Patient E', amount: 23450, claims: 6 },
  { claimant: 'Patient F', amount: 21200, claims: 4 },
  { claimant: 'Patient G', amount: 19850, claims: 7 },
  { claimant: 'Patient H', amount: 18600, claims: 5 }
]


export default function InteractiveTopClaimantsChart({
  data = mockData,
  height = 400,
  className = '',
  theme = 'professional'
}: InteractiveTopClaimantsChartProps) {
  const colors = {
    professional: '#3b82f6',
    accessible: '#2563eb',
    dark: '#60a5fa'
  }

  const barColor = colors[theme]

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: {
        color: '#374151'
      },
      formatter: function (params: any) {
        const data = params[0]
        const item = mockData.find(d => d.claimant === data.name)
        return `
          <div style="font-weight: 600; margin-bottom: 8px;">${data.name}</div>
          <div style="margin: 4px 0;">
            <div style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: #3b82f6; margin-right: 8px;"></div>
            <span style="color: #6b7280;">Total Cost:</span>
            <span style="font-weight: 500; color: #1f2937; margin-left: 8px;">$${data.value.toLocaleString()}</span>
          </div>
          <div style="margin: 4px 0;">
            <div style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: #9ca3af; margin-right: 8px;"></div>
            <span style="color: #6b7280;">Claims:</span>
            <span style="font-weight: 500; color: #1f2937; margin-left: 8px;">${item?.claims || 0}</span>
          </div>
          <div style="padding-top: 8px; border-top: 1px solid #e5e7eb; margin-top: 8px;">
            <span style="color: #6b7280; font-size: 12px;">Avg per claim: $${item ? (item.amount / item.claims).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</span>
          </div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.claimant),
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
        rotate: -45
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
        formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        data: data.map(item => ({
          value: item.amount,
          name: item.claimant,
          itemStyle: {
            color: barColor,
            borderRadius: [4, 4, 0, 0],
            shadowBlur: 4,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowOffsetY: 2
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
          }
        })),
        type: 'bar',
        barWidth: '60%',
        animationDelay: function (idx: number) {
          return idx * 100
        }
      }
    ],
    animationEasing: 'elasticOut',
    animationDelayUpdate: function (idx: number) {
      return idx * 50
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Top Cost Drivers
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Highest-cost patients by total healthcare spending
        </p>
      </div>
      
      <ReactECharts option={option} style={{ height: `${height}px` }} />
    </div>
  )
}