'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar
} from 'recharts'

export default function HighCostBandsChart() {
  const data = useMemo(
    () => [
      { 
        band: '<$1K', 
        memberCount: 2845, 
        totalCost: 892000, 
        avgCostPerMember: 313,
        costPercentage: 8.2
      },
      { 
        band: '$1K-$10K', 
        memberCount: 478, 
        totalCost: 2340000, 
        avgCostPerMember: 4895,
        costPercentage: 21.5
      },
      { 
        band: '$10K-$50K', 
        memberCount: 156, 
        totalCost: 4120000, 
        avgCostPerMember: 26410,
        costPercentage: 37.9
      },
      { 
        band: '$50K+', 
        memberCount: 23, 
        totalCost: 3520000, 
        avgCostPerMember: 153043,
        costPercentage: 32.4
      }
    ],
    []
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value)

  const formatNumber = (value: number) => value.toLocaleString()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="band" 
          tickLine={false} 
          axisLine={{ stroke: '#e5e7eb' }}
          fontSize={11}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={formatNumber}
          fontSize={10}
          width={50}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={formatCurrency}
          fontSize={10}
          width={60}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === 'Member Count') return [formatNumber(value), name]
            return [formatCurrency(value), name]
          }}
          cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Bar
          yAxisId="left"
          dataKey="memberCount"
          name="Member Count"
          fill="rgba(59, 130, 246, 0.7)"
          stroke="rgba(37, 99, 235, 1)"
          radius={[2, 2, 0, 0]}
        />
        <Bar
          yAxisId="right"
          dataKey="totalCost"
          name="Total Cost"
          fill="rgba(239, 68, 68, 0.7)"
          stroke="rgba(220, 38, 38, 1)"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}