'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
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
      <div className="flex h-40 items-center justify-center text-sm text-[var(--foreground)]/60">
        No enrollment data available for the selected range.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 12 }}>
        <defs>
          <linearGradient id="enrollmentArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EC4899" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#A855F7" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(236, 72, 153, 0.2)" />
        <XAxis
          dataKey="label"
          stroke="rgba(15, 23, 42, 0.55)"
          fontSize={12}
          tickMargin={8}
        />
        <YAxis
          stroke="rgba(15, 23, 42, 0.45)"
          fontSize={12}
          width={60}
          tickFormatter={(value: number) => numberFormatter.format(value)}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(236, 72, 153, 0.35)', strokeDasharray: '4 4' }}
          formatter={(value: any) => numberFormatter.format(Number(value))}
          labelFormatter={label => label}
          contentStyle={{
            backgroundColor: 'var(--muted-background)',
            border: '1px solid var(--surface-border)',
            borderRadius: '0.75rem',
            color: 'var(--foreground)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(15,23,42,0.6)' }} />
        <Area
          type="monotone"
          dataKey="enrollment"
          stroke="none"
          fill="url(#enrollmentArea)"
        />
        <Line
          type="monotone"
          dataKey="enrollment"
          name="Enrolled Employees"
          stroke="#EC4899"
          strokeWidth={3}
          dot={{ r: 3.5, strokeWidth: 2, fill: '#fff', stroke: '#EC4899' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#EC4899', fill: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default EnrollmentTrendChart
