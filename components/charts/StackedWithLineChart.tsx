'use client'

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MonthlySummary } from '@/lib/schemas/fees'
import { ChartDataPoint } from '@/lib/schemas/fees'

interface StackedWithLineChartProps {
  monthlyData: ChartDataPoint[]
  summaries: MonthlySummary[]
  height?: number
}

export function StackedWithLineChart({ monthlyData, summaries, height = 400 }: StackedWithLineChartProps) {
  // Merge monthly category data with summaries for loss ratio
  const chartData = monthlyData.map(monthData => {
    const summary = summaries.find(s => s.month === monthData.month)
    return {
      ...monthData,
      lossRatio: summary?.lossRatio ? summary.lossRatio * 100 : null, // Convert to percentage
      totalCost: summary?.totalCost || 0,
    }
  })
  
  // Get unique categories for colors
  const categories = Object.keys(chartData[0] || {}).filter(key => 
    !['month', 'lossRatio', 'totalCost'].includes(key)
  )
  
  const colors = [
    '#8fb8db', // soft blue
    '#a7d8c1', // soft green
    '#f0c987', // warm amber
    '#e29a8c', // muted coral
    '#c9b4e5', // lavender
    '#97d8e2', // pastel teal
    '#f2b28c', // peach
    '#c8d89b', // sage
  ]
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }
  
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No data available for chart
      </div>
    )
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d9ccb8" opacity={0.6} />
        <XAxis 
          dataKey="month" 
          stroke="#8b7f70"
          fontSize={12}
        />
        <YAxis 
          yAxisId="left"
          stroke="#8b7f70"
          fontSize={12}
          tickFormatter={formatCurrency}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right"
          stroke="#8b7f70"
          fontSize={12}
          tickFormatter={formatPercent}
          domain={[0, 150]} // 0% to 150%
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fdf9f2',
            border: '1px solid #eadfce',
            borderRadius: '0.5rem',
            color: '#2f2a24'
          }}
          formatter={(value: any, name: string) => {
            if (name === 'lossRatio') {
              return [formatPercent(value), 'Loss Ratio']
            }
            return [formatCurrency(value), name]
          }}
        />
        <Legend />
        
        {/* Stacked bars for categories */}
        {categories.map((category, index) => (
          <Bar
            key={category}
            yAxisId="left"
            dataKey={category}
            stackId="claims"
            fill={colors[index % colors.length]}
            name={category}
          />
        ))}
        
        {/* Line for loss ratio */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="lossRatio"
          stroke="#c75237"
          strokeWidth={2}
          dot={{ fill: '#c75237', strokeWidth: 2, r: 4 }}
          name="Loss Ratio (%)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
