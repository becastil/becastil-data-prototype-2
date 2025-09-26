'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { TooltipProps } from 'recharts'

interface MonthlyActualBudgetPoint {
  month: string
  rawMonth: string
  actualTotal: number
  budget: number
  medicalClaims: number
  rxClaims: number
  adminFees: number
  adjustments: number
  variance: number
  eeCount: number
}

interface MonthlyActualBudgetChartProps {
  data: MonthlyActualBudgetPoint[]
  height?: number
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function formatVariance(value: number) {
  const formatted = formatCurrency(Math.abs(value))
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

function formatMonthLabel(rawMonth: string) {
  const [year, month] = rawMonth.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function MonthlyTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const point = payload[0].payload as MonthlyActualBudgetPoint
  const varianceClass = 'text-black'

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-black">
        {formatMonthLabel(point.rawMonth)}
      </div>
      <div className="mt-3 space-y-1 text-sm text-black">
        <div className="flex items-center justify-between">
          <span>Actual</span>
          <span>{formatCurrency(point.actualTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Budget (PEPM × EE)</span>
          <span>{formatCurrency(point.budget)}</span>
        </div>
        <div className={`flex items-center justify-between ${varianceClass}`}>
          <span>Variance vs Budget</span>
          <span>{formatVariance(point.variance)}</span>
        </div>
      </div>
      <div className="mt-3 border-t border-black/10 pt-3 text-xs text-black/70">
        <div className="flex items-center justify-between">
          <span>Medical Claims</span>
          <span>{formatCurrency(point.medicalClaims)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Rx Claims</span>
          <span>{formatCurrency(point.rxClaims)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Administrative Fees</span>
          <span>{formatCurrency(point.adminFees)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Adjustments (Rebates &amp; Stop-Loss)</span>
          <span>{formatCurrency(point.adjustments)}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span>Enrolled EE Count</span>
          <span>{point.eeCount}</span>
        </div>
      </div>
    </div>
  )
}

export function MonthlyActualBudgetChart({ data, height = 400 }: MonthlyActualBudgetChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-black/60">
        No monthly cost data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 36, left: 20, bottom: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" opacity={0.6} />
        <XAxis dataKey="month" stroke="#111827" fontSize={12} />
        <YAxis stroke="#111827" fontSize={12} tickFormatter={formatCurrency} width={90} />
        <Tooltip content={<MonthlyTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="actualTotal"
          name="Actual Claims & Expenses"
          fill="#111827"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
        <Line
          type="monotone"
          dataKey="budget"
          name="Budget (PEPM × EE)"
          stroke="#6b7280"
          strokeWidth={2}
          dot={{ fill: '#6b7280', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default MonthlyActualBudgetChart
