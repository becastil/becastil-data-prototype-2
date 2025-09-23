'use client'

import ReactECharts from 'echarts-for-react'
import BudgetVsClaimsChart from './BudgetVsClaimsChart'

export default function MinimalCharts() {
  // Trend data
  const trendData = [
    { month: 'Jan', amount: 218340 },
    { month: 'Feb', amount: 205120 },
    { month: 'Mar', amount: 198560 },
    { month: 'Apr', amount: 245800 },
    { month: 'May', amount: 225600 },
    { month: 'Jun', amount: 212400 }
  ]

  // Cost distribution
  const distributionData = [
    { name: 'Medical', value: 976200 },
    { name: 'Pharmacy', value: 437500 },
    { name: 'Administrative', value: 27100 }
  ]

  // Ultra-minimal trend chart
  const trendOption = {
    grid: { left: '10%', right: '10%', top: '10%', bottom: '20%' },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.month),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#999' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false }
    },
    series: [{
      data: trendData.map(item => item.amount),
      type: 'line',
      lineStyle: { color: '#000', width: 1 },
      itemStyle: { color: '#000' },
      symbol: 'none'
    }]
  }

  // Ultra-minimal distribution chart
  const distributionOption = {
    series: [{
      type: 'pie',
      radius: ['0%', '50%'],
      center: ['50%', '50%'],
      data: distributionData.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: index === 0 ? '#000' : index === 1 ? '#666' : '#ccc'
        },
        label: { show: false },
        labelLine: { show: false }
      }))
    }]
  }

  return (
    <div className="space-y-16 text-left">
      <div>
        <div className="mb-8 text-sm text-gray-600">Budget vs Claims and Expenses</div>
        <BudgetVsClaimsChart />
      </div>

      <div>
        <div className="mb-8 text-sm text-gray-600">Trend</div>
        <div className="h-48">
          <ReactECharts option={trendOption} style={{ height: '100%' }} />
        </div>
      </div>

      <div>
        <div className="mb-8 text-sm text-gray-600">Distribution</div>
        <div className="h-48">
          <ReactECharts option={distributionOption} style={{ height: '100%' }} />
        </div>
      </div>
    </div>
  )
}