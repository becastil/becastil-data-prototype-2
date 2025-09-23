'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{`${label} 2024`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {entry.name === 'Claims' 
                ? entry.value.toLocaleString()
                : `$${(entry.value / 1000).toFixed(0)}k`
              }
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function InteractiveClaimsTrendChart({
  data = mockData,
  height = 400,
  className = '',
  theme = 'professional'
}: InteractiveClaimsTrendChartProps) {
  const colors = {
    professional: {
      claims: '#3b82f6',
      amount: '#10b981',
      grid: '#e5e7eb'
    },
    accessible: {
      claims: '#2563eb',
      amount: '#059669',
      grid: '#d1d5db'
    },
    dark: {
      claims: '#60a5fa',
      amount: '#34d399',
      grid: '#374151'
    }
  }

  const themeColors = colors[theme]

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
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            yAxisId="claims"
            orientation="left"
            stroke={themeColors.claims}
            fontSize={12}
          />
          <YAxis 
            yAxisId="amount"
            orientation="right"
            stroke={themeColors.amount}
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            yAxisId="claims"
            type="monotone"
            dataKey="claims"
            stroke={themeColors.claims}
            strokeWidth={2}
            dot={{ fill: themeColors.claims, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: themeColors.claims, strokeWidth: 2 }}
            name="Claims"
          />
          <Line
            yAxisId="amount"
            type="monotone"
            dataKey="amount"
            stroke={themeColors.amount}
            strokeWidth={2}
            dot={{ fill: themeColors.amount, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: themeColors.amount, strokeWidth: 2 }}
            name="Amount"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}