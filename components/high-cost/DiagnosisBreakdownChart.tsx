'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DiagnosisBreakdownChartProps {
  categories: Array<{
    category: string
    amount: number
    percentage: number
  }>
  distribution: {
    facilityInpatient: number
    facilityOutpatient: number
    professional: number
    pharmacy: number
  }
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default function DiagnosisBreakdownChart({ categories, distribution }: DiagnosisBreakdownChartProps) {
  const distributionEntries = [
    { label: 'Facility Inpatient', value: distribution.facilityInpatient },
    { label: 'Facility Outpatient', value: distribution.facilityOutpatient },
    { label: 'Professional', value: distribution.professional },
    { label: 'Pharmacy', value: distribution.pharmacy },
  ]

  const totalDistribution = distributionEntries.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-lg font-medium text-[#2f2a24]">High-Cost Diagnosis Overview</h3>
        <p className="text-sm text-[#5b5247]">
          Top diagnosis categories ranked by total paid amount with cost distribution across service lines.
        </p>
      </header>

      <div className="h-64">
        <ResponsiveContainer>
          <BarChart layout="vertical" data={categories} margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9ccb8" opacity={0.6} />
            <XAxis
              type="number"
              tickFormatter={value => currencyFormatter.format(value)}
              stroke="#8b7f70"
            />
            <YAxis type="category" dataKey="category" width={160} stroke="#8b7f70" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={value => currencyFormatter.format(Number(value))}
              contentStyle={{
                backgroundColor: '#fdf9f2',
                border: '1px solid #eadfce',
                borderRadius: '0.5rem',
                color: '#2f2a24',
              }}
            />
            <Bar dataKey="amount" fill="#8fb8db" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#eadfce] bg-[#fdf9f2] p-4 text-sm text-[#2f2a24] md:grid-cols-2">
        {distributionEntries.map(entry => (
          <div key={entry.label} className="flex items-center justify-between">
            <span>{entry.label}</span>
            <div className="text-right">
              <div className="font-semibold">{currencyFormatter.format(entry.value)}</div>
              <div className="text-xs text-[#5b5247]">
                {totalDistribution > 0 ? ((entry.value / totalDistribution) * 100).toFixed(1) : '0.0'}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
