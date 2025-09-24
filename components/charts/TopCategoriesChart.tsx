'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CategoryTotal } from '@/lib/schemas/fees'

interface TopCategoriesChartProps {
  categories: CategoryTotal[]
  height?: number
}

export function TopCategoriesChart({ categories, height = 350 }: TopCategoriesChartProps) {
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
  
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No category data available
      </div>
    )
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart 
        data={categories}
        layout="horizontal"
        margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis 
          type="number"
          stroke="#6B7280"
          fontSize={12}
          tickFormatter={formatCurrency}
        />
        <YAxis 
          type="category"
          dataKey="category"
          stroke="#6B7280"
          fontSize={12}
          width={75}
          tick={{ fontSize: 11 }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '0.375rem',
            color: '#F9FAFB'
          }}
          formatter={(value: any, name: string) => {
            if (name === 'amount') {
              const item = categories.find(c => c.amount === value)
              return [
                `${formatCurrency(value)} (${formatPercent(item?.percentage || 0)})`,
                'Amount'
              ]
            }
            return [value, name]
          }}
        />
        <Bar 
          dataKey="amount" 
          fill="#3B82F6"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}