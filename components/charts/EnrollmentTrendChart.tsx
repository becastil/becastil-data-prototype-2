'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface EnrollmentTrendChartProps {
  data: Array<{ month: string; label: string; enrollment: number }>
  height?: number
}

const numberFormatter = new Intl.NumberFormat('en-US')

export function EnrollmentTrendChart({ data, height = 260 }: EnrollmentTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-black/60">
        No enrollment data available for the selected range.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 12 }}>
        <CartesianGrid strokeDasharray="4 8" stroke="#d1d5db" />
        <XAxis
          dataKey="label"
          stroke="#111827"
          fontSize={12}
          tickMargin={8}
        />
        <YAxis
          stroke="#111827"
          fontSize={12}
          width={60}
          tickFormatter={(value: number) => numberFormatter.format(value)}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value: any) => numberFormatter.format(Number(value))}
          labelFormatter={label => label}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="enrollment"
          name="Enrolled Employees"
          stroke="#111827"
          strokeWidth={2.2}
          dot={{ r: 3.5, strokeWidth: 2, fill: '#fff' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default EnrollmentTrendChart
