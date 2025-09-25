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
  const getBarColor = (index: number) => {
    const colors = [
      '#c75237',
      '#d97a4d',
      '#e29a8c',
      '#edb89d',
      '#f2d1ac',
      '#e0c995',
      '#c3bf7d',
      '#a7b97e',
      '#8aa98a',
      '#76a3a3',
    ]
    return colors[index % colors.length]
  }
  
  if (claimants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#9b9287]">
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
          <CartesianGrid strokeDasharray="3 3" stroke="#d9ccb8" opacity={0.6} />
          <XAxis 
            type="number"
            stroke="#8b7f70"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <YAxis 
            type="category"
            dataKey="memberId"
            stroke="#8b7f70"
            fontSize={12}
            width={55}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fdf9f2',
              border: '1px solid #eadfce',
              borderRadius: '0.5rem',
              color: '#2f2a24'
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
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="bg-[#f3ede2] rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4 text-sm text-[#4f463b]">
          <div>
            <div className="text-[#5b5247]">Top 3 Members</div>
            <div className="font-medium text-[#2f2a24]">
              {formatPercent(claimants.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0))} of total
            </div>
          </div>
          <div>
            <div className="text-[#5b5247]">Highest Single</div>
            <div className="font-medium text-[#2f2a24]">
              {claimants[0] ? formatCurrency(claimants[0].totalAmount) : '$0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
