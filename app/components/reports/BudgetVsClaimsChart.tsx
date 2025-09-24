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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)

export default function BudgetVsClaimsChart() {
  const data = useMemo(
    () => [
      { month: 'Jan', claims: 42000, expenses: 9500, budget: 58000 },
      { month: 'Feb', claims: 38000, expenses: 8800, budget: 55000 },
      { month: 'Mar', claims: 45000, expenses: 11200, budget: 60000 },
      { month: 'Apr', claims: 36000, expenses: 8200, budget: 52000 },
      { month: 'May', claims: 41000, expenses: 9800, budget: 57000 },
      { month: 'Jun', claims: 47000, expenses: 10500, budget: 61000 },
      { month: 'Jul', claims: 44000, expenses: 10100, budget: 59000 },
      { month: 'Aug', claims: 39000, expenses: 9200, budget: 56000 },
      { month: 'Sep', claims: 37000, expenses: 8600, budget: 54000 },
      { month: 'Oct', claims: 43000, expenses: 9900, budget: 58000 },
      { month: 'Nov', claims: 48000, expenses: 11800, budget: 62000 },
      { month: 'Dec', claims: 45000, expenses: 10200, budget: 60000 }
    ],
    []
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="month" 
          tickLine={false} 
          axisLine={{ stroke: '#e5e7eb' }}
          fontSize={12}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={value => formatCurrency(Number(value))}
          fontSize={12}
          width={60}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Bar
          yAxisId="left"
          dataKey="claims"
          name="Claims"
          fill="rgba(59, 130, 246, 0.7)"
          stroke="rgba(37, 99, 235, 1)"
          radius={[2, 2, 0, 0]}
        />
        <Bar
          yAxisId="left"
          dataKey="expenses"
          name="Expenses"
          fill="rgba(249, 115, 22, 0.7)"
          stroke="rgba(234, 88, 12, 1)"
          radius={[2, 2, 0, 0]}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="budget"
          name="Budget"
          stroke="rgba(16, 185, 129, 1)"
          strokeWidth={2}
          dot={{ r: 2 }}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
