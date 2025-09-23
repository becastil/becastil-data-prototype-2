'use client'

import ReactECharts from 'echarts-for-react'

interface ClaimsTrendData {
  month: string
  claims: number
  amount: number
}

interface InteractiveClaimsTrendChartProps {
  data?: ClaimsTrendData[]
  height?: number
  className?: string
  theme?: 'professional' | 'accessible' | 'dark'
}

const mockData: ClaimsTrendData[] = [
  { month: 'Jan', claims: 820, amount: 218340 },
  { month: 'Feb', claims: 750, amount: 205120 },
  { month: 'Mar', claims: 680, amount: 198560 },
  { month: 'Apr', claims: 920, amount: 245800 },
  { month: 'May', claims: 850, amount: 225600 },
  { month: 'Jun', claims: 780, amount: 212400 },
  { month: 'Jul', claims: 890, amount: 238900 },
  { month: 'Aug', claims: 920, amount: 248500 },
  { month: 'Sep', claims: 880, amount: 235700 },
  { month: 'Oct', claims: 950, amount: 258900 },
  { month: 'Nov', claims: 920, amount: 248200 },
  { month: 'Dec', claims: 980, amount: 268400 }
]


export default function InteractiveClaimsTrendChart({
  data = mockData,
  height = 400,
  className = '',
  theme = 'professional'
}: InteractiveClaimsTrendChartProps) {
  const colors = {
    professional: {
      claims: '#3b82f6',
      amount: '#10b981'
    },
    accessible: {
      claims: '#2563eb',
      amount: '#059669'
    },
    dark: {
      claims: '#60a5fa',
      amount: '#34d399'
    }
  }

  const themeColors = colors[theme]

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: {
        color: '#374151'
      },
      formatter: function (params: any) {
        const month = params[0].axisValue
        let content = `<div style="font-weight: 600; margin-bottom: 8px;">${month} 2024</div>`
        params.forEach((param: any) => {
          const value = param.seriesName === 'Claims' 
            ? param.value.toLocaleString()
            : `$${(param.value / 1000).toFixed(0)}k`
          content += `
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${param.color};"></div>
              <span style="color: #6b7280;">${param.seriesName}:</span>
              <span style="font-weight: 500; color: #1f2937;">${value}</span>
            </div>
          `
        })
        return content
      }
    },
    legend: {
      data: ['Claims', 'Amount'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.month),
      axisLine: {
        lineStyle: {
          color: '#6b7280'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Claims',
        position: 'left',
        axisLine: {
          lineStyle: {
            color: themeColors.claims
          }
        },
        axisLabel: {
          color: '#6b7280'
        }
      },
      {
        type: 'value',
        name: 'Amount ($)',
        position: 'right',
        axisLine: {
          lineStyle: {
            color: themeColors.amount
          }
        },
        axisLabel: {
          color: '#6b7280',
          formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`
        }
      }
    ],
    series: [
      {
        name: 'Claims',
        type: 'line',
        yAxisIndex: 0,
        data: data.map(item => item.claims),
        lineStyle: {
          color: themeColors.claims,
          width: 2
        },
        itemStyle: {
          color: themeColors.claims
        },
        smooth: true,
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: 'Amount',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(item => item.amount),
        lineStyle: {
          color: themeColors.amount,
          width: 2
        },
        itemStyle: {
          color: themeColors.amount
        },
        smooth: true,
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Healthcare Claims Trend
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monthly claims volume and total costs over time
        </p>
      </div>
      
      <ReactECharts option={option} style={{ height: `${height}px` }} />
    </div>
  )
}