'use client'

import ReactECharts from 'echarts-for-react'

interface CostBreakdownData {
  name: string
  value: number
  percentage: number
}

interface InteractiveCostBreakdownChartProps {
  data?: CostBreakdownData[]
  height?: number
  className?: string
  theme?: 'professional' | 'accessible' | 'dark'
}

const mockData: CostBreakdownData[] = [
  { name: 'Inpatient Care', value: 425600, percentage: 45 },
  { name: 'Outpatient Care', value: 318900, percentage: 34 },
  { name: 'Pharmacy', value: 218750, percentage: 23 },
  { name: 'Emergency Care', value: 142300, percentage: 15 },
  { name: 'Preventive Care', value: 98400, percentage: 10 },
  { name: 'Mental Health', value: 75200, percentage: 8 }
]

const COLORS = {
  professional: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  accessible: ['#1e40af', '#047857', '#d97706', '#dc2626', '#7c3aed', '#0891b2'],
  dark: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee']
}

export default function InteractiveCostBreakdownChart({
  data = mockData,
  height = 400,
  className = '',
  theme = 'professional'
}: InteractiveCostBreakdownChartProps) {
  const colors = COLORS[theme]

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: {
        color: '#374151'
      },
      formatter: function (params: any) {
        return `
          <div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>
          <div style="margin: 4px 0;">
            <span style="color: #6b7280;">Amount:</span>
            <span style="font-weight: 500; color: #1f2937; margin-left: 8px;">$${params.value.toLocaleString()}</span>
          </div>
          <div style="margin: 4px 0;">
            <span style="color: #6b7280;">Percentage:</span>
            <span style="font-weight: 500; color: #1f2937; margin-left: 8px;">${params.percent.toFixed(1)}%</span>
          </div>
        `
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      textStyle: {
        color: '#6b7280',
        fontSize: 12
      }
    },
    series: [
      {
        name: 'Cost Breakdown',
        type: 'pie',
        radius: ['0%', '70%'],
        center: ['50%', '45%'],
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: colors[index % colors.length],
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'inside',
            formatter: function (params: any) {
              return params.percent >= 5 ? `${params.percent.toFixed(0)}%` : ''
            },
            color: '#fff',
            fontWeight: 600,
            fontSize: 12
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          }
        })),
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx: number) {
          return Math.random() * 200
        }
      }
    ]
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Cost Breakdown by Service
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Distribution of healthcare spending across service types
        </p>
      </div>
      
      <ReactECharts option={option} style={{ height: `${height}px` }} />
    </div>
  )
}