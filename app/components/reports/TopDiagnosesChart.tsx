'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line
} from 'recharts'

export default function TopDiagnosesChart() {
  const rawData = useMemo(
    () => [
      { diagnosis: 'Diabetes', cost: 2850000, claims: 1245 },
      { diagnosis: 'Hypertension', cost: 1920000, claims: 2156 },
      { diagnosis: 'Cancer', cost: 1650000, claims: 324 },
      { diagnosis: 'Heart Disease', cost: 1480000, claims: 567 },
      { diagnosis: 'Kidney Disease', cost: 980000, claims: 234 },
      { diagnosis: 'Mental Health', cost: 750000, claims: 892 },
      { diagnosis: 'Respiratory', cost: 620000, claims: 678 },
      { diagnosis: 'Arthritis', cost: 480000, claims: 1123 }
    ],
    []
  )

  const data = useMemo(() => {
    const totalCost = rawData.reduce((sum, item) => sum + item.cost, 0)
    let cumulativeCost = 0
    
    return rawData
      .sort((a, b) => b.cost - a.cost)
      .map((item, index) => {
        cumulativeCost += item.cost
        const cumulativePercentage = (cumulativeCost / totalCost) * 100
        return {
          ...item,
          cumulativePercentage: Math.round(cumulativePercentage * 10) / 10,
          rank: index + 1
        }
      })
  }, [rawData])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value)

  const formatPercentage = (value: number) => `${value}%`

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="diagnosis" 
          tickLine={false} 
          axisLine={{ stroke: '#e5e7eb' }}
          fontSize={10}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={formatCurrency}
          fontSize={10}
          width={60}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={formatPercentage}
          fontSize={10}
          width={50}
          domain={[0, 100]}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === 'Cumulative %') return [formatPercentage(value), name]
            return [formatCurrency(value), name]
          }}
          cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Bar
          yAxisId="left"
          dataKey="cost"
          name="Total Cost"
          fill="rgba(59, 130, 246, 0.7)"
          stroke="rgba(37, 99, 235, 1)"
          radius={[2, 2, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumulativePercentage"
          name="Cumulative %"
          stroke="rgba(239, 68, 68, 1)"
          strokeWidth={2}
          dot={{ r: 2, fill: '#ef4444' }}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}