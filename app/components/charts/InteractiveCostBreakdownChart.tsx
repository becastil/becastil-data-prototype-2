'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          {data.name}
        </p>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div>Amount: <span className="font-medium">${data.value.toLocaleString()}</span></div>
          <div>Percentage: <span className="font-medium">{data.percentage}%</span></div>
        </div>
      </div>
    )
  }
  return null
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null // Don't show labels for slices smaller than 5%
  
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function InteractiveCostBreakdownChart({
  data = mockData,
  height = 400,
  className = '',
  theme = 'professional'
}: InteractiveCostBreakdownChartProps) {
  const colors = COLORS[theme]

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
      
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={Math.min(height * 0.35, 120)}
            fill="#8884d8"
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
                style={{
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
                  cursor: 'pointer'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}