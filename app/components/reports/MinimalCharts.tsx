'use client'

import ReactECharts from 'echarts-for-react'

export default function MinimalCharts() {
  // Claims trend data
  const trendData = [
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

  // Cost breakdown data
  const costBreakdownData = [
    { name: 'Inpatient', value: 425600 },
    { name: 'Outpatient', value: 318900 },
    { name: 'Pharmacy', value: 437500 },
    { name: 'Emergency', value: 142300 },
    { name: 'Specialty', value: 89400 },
    { name: 'Stop Loss', value: 67000 }
  ]

  // Top cost drivers
  const topDrivers = [
    { name: 'Member A-4821', amount: 38500, visits: 9 },
    { name: 'Member B-3492', amount: 32450, visits: 7 },
    { name: 'Member C-2847', amount: 28740, visits: 5 },
    { name: 'Member D-1956', amount: 25890, visits: 8 },
    { name: 'Member E-1423', amount: 23450, visits: 6 }
  ]

  // Monthly comparison data
  const monthlyComparison = [
    { month: 'Oct 2023', budget: 220000, actual: 215000 },
    { month: 'Nov 2023', budget: 225000, actual: 232000 },
    { month: 'Dec 2023', budget: 230000, actual: 228000 },
    { month: 'Jan 2024', budget: 235000, actual: 241000 },
    { month: 'Feb 2024', budget: 240000, actual: 238000 },
    { month: 'Mar 2024', budget: 245000, actual: 251000 }
  ]

  // Trend chart configuration
  const trendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: '#d1d5db', width: 1 } }
    },
    grid: { left: '5%', right: '5%', top: '15%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.month),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11 }
    },
    yAxis: [
      {
        type: 'value',
        position: 'left',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6', width: 1 } }
      },
      {
        type: 'value',
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 11,
          formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`
        },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Claims',
        type: 'line',
        yAxisIndex: 0,
        data: trendData.map(item => item.claims),
        lineStyle: { color: '#000', width: 2 },
        itemStyle: { color: '#000' },
        symbol: 'circle',
        symbolSize: 4,
        smooth: false
      },
      {
        name: 'Amount',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map(item => item.amount),
        lineStyle: { color: '#6b7280', width: 2 },
        itemStyle: { color: '#6b7280' },
        symbol: 'circle',
        symbolSize: 4,
        smooth: false
      }
    ]
  }

  // Cost breakdown chart configuration
  const breakdownOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 12 },
      formatter: '{b}: ${c0}k ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['0%', '60%'],
        center: ['50%', '50%'],
        data: costBreakdownData.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: `hsl(${index * 60}, 20%, ${30 + index * 10}%)`,
            borderWidth: 0
          },
          label: {
            color: '#374151',
            fontSize: 11,
            formatter: '{b}\n{d}%'
          },
          labelLine: {
            lineStyle: { color: '#d1d5db' }
          }
        })),
        emphasis: {
          itemStyle: { shadowBlur: 0, shadowOffsetX: 0, shadowColor: 'none' }
        }
      }
    ]
  }

  // Monthly comparison chart configuration
  const comparisonOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 12 }
    },
    grid: { left: '5%', right: '5%', top: '10%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyComparison.map(item => item.month),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11, rotate: -45 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: '#9ca3af', 
        fontSize: 11,
        formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`
      },
      splitLine: { lineStyle: { color: '#f3f4f6', width: 1 } }
    },
    series: [
      {
        name: 'Budget',
        type: 'bar',
        data: monthlyComparison.map(item => item.budget),
        itemStyle: { color: '#e5e7eb' },
        barWidth: '40%'
      },
      {
        name: 'Actual',
        type: 'bar',
        data: monthlyComparison.map(item => item.actual),
        itemStyle: { color: '#374151' },
        barWidth: '40%'
      }
    ]
  }

  return (
    <div className="space-y-16">
      {/* Claims Trend */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-8">Claims Trend</h2>
        <div className="h-64">
          <ReactECharts option={trendOption} style={{ height: '100%' }} />
        </div>
      </div>

      {/* Cost Breakdown */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-8">Cost Distribution</h2>
        <div className="h-64">
          <ReactECharts option={breakdownOption} style={{ height: '100%' }} />
        </div>
      </div>

      {/* Monthly Comparison */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-8">Budget vs Actual</h2>
        <div className="h-64">
          <ReactECharts option={comparisonOption} style={{ height: '100%' }} />
        </div>
      </div>

      {/* Top Cost Drivers */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-8">Top Cost Drivers</h2>
        <div className="space-y-3">
          {topDrivers.map((driver, index) => (
            <div key={driver.name} className="flex justify-between items-center py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-6 text-center">{index + 1}</span>
                <span className="text-gray-900">{driver.name}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xs text-gray-500">{driver.visits} visits</span>
                <span className="tabular-nums text-gray-900 min-w-[80px] text-right">
                  ${driver.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-sm font-medium text-gray-500 mb-6">Key Insights</h2>
        <div className="space-y-4 text-sm text-gray-700">
          <p>• Claims volume increased 8.2% over the prior period, driven primarily by specialty care</p>
          <p>• Pharmacy costs represent 30% of total expenses, with specialty drugs showing highest growth</p>
          <p>• Five members account for 12% of total costs, indicating concentration risk</p>
          <p>• PEPM trending above budget by $3.21, requiring attention to cost management</p>
        </div>
      </div>
    </div>
  )
}