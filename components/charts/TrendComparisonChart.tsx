'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MonthlySummary } from '@/lib/schemas/fees'

interface TrendComparisonChartProps {
  summaries: MonthlySummary[]
  height?: number
}

export function TrendComparisonChart({ summaries, height = 350 }: TrendComparisonChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  if (summaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No trend data available
      </div>
    )
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart 
        data={summaries}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis 
          dataKey="month" 
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis 
          stroke="#6B7280"
          fontSize={12}
          tickFormatter={formatCurrency}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '0.375rem',
            color: '#F9FAFB'
          }}
          formatter={(value: any, name: string) => {
            return [formatCurrency(value), name]
          }}
        />
        <Legend />
        
        <Line
          type="monotone"
          dataKey="claims"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          name="Claims"
        />
        
        <Line
          type="monotone"
          dataKey="totalCost"
          stroke="#EF4444"
          strokeWidth={2}
          dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
          name="Total Cost"
        />
        
        {summaries.some(s => s.premium > 0) && (
          <Line
            type="monotone"
            dataKey="premium"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            name="Premium"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}