'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TopClaimant } from '@/lib/schemas/fees'

interface TopClaimantsChartProps {
  claimants: TopClaimant[]
  height?: number
}

export function TopClaimantsChart({ claimants, height = 350 }: TopClaimantsChartProps) {
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
  
  // Colors for the bars - gradient from high to low impact
  const getBarColor = (index: number, total: number) => {
    const colors = [
      '#DC2626', // red for highest
      '#EA580C', // orange-red
      '#D97706', // amber
      '#CA8A04', // yellow
      '#65A30D', // lime
      '#16A34A', // green
      '#059669', // emerald
      '#0D9488', // teal
      '#0891B2', // cyan
      '#0284C7', // blue
    ]
    return colors[index % colors.length]
  }
  
  if (claimants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No claimant data available
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height - 100}>
        <BarChart 
          data={claimants}
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
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
            dataKey="memberId"
            stroke="#6B7280"
            fontSize={12}
            width={55}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.375rem',
              color: '#F9FAFB'
            }}
            formatter={(value: any, name: string, props: any) => {
              const data = props.payload
              if (name === 'totalAmount') {
                return [
                  <div key="tooltip">
                    <div>{formatCurrency(value)} ({formatPercent(data.percentage)})</div>
                    <div className="text-sm opacity-75">{data.claimCount} claims</div>
                  </div>,
                  'Total Claims'
                ]
              }
              return [value, name]
            }}
          />
          <Bar dataKey="totalAmount">
            {claimants.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index, claimants.length)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">Top 3 Members</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {formatPercent(claimants.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0))} of total
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Highest Single</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {claimants[0] ? formatCurrency(claimants[0].totalAmount) : '$0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}