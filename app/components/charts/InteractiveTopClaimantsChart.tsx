'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              ${data.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Claims:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {data.claims}
            </span>
          </div>
          <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Avg per claim: ${(data.amount / data.claims).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

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
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="claimant" 
            stroke="#6b7280"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="amount" 
            fill={barColor}
            radius={[4, 4, 0, 0]}
            style={{
              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
              cursor: 'pointer'
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}