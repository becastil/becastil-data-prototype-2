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
        <h3 className="text-lg font-medium text-black">High-Cost Diagnosis Overview</h3>
        <p className="text-sm text-black/70">
          Top diagnosis categories ranked by total paid amount with cost distribution across service lines.
        </p>
      </header>

      <div className="h-64">
        <ResponsiveContainer>
          <BarChart layout="vertical" data={categories} margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={value => currencyFormatter.format(value)} />
            <YAxis type="category" dataKey="category" width={160} />
            <Tooltip formatter={value => currencyFormatter.format(Number(value))} />
            <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-black/10 bg-white p-4 text-sm text-black md:grid-cols-2">
        {distributionEntries.map(entry => (
          <div key={entry.label} className="flex items-center justify-between">
            <span>{entry.label}</span>
            <div className="text-right">
              <div className="font-semibold">{currencyFormatter.format(entry.value)}</div>
              <div className="text-xs text-black/60">
                {totalDistribution > 0 ? ((entry.value / totalDistribution) * 100).toFixed(1) : '0.0'}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
