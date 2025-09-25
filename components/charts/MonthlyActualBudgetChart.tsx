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
  const varianceClass = point.variance > 0
    ? 'text-[#c75237]'
    : point.variance < 0
    ? 'text-[#2f6d55]'
    : 'text-[#5b5247]'

  return (
    <div className="rounded-lg border border-[#eadfce] bg-[#fdf9f2] p-4 shadow-sm">
      <div className="text-sm font-semibold text-[#2f2a24]">
        {formatMonthLabel(point.rawMonth)}
      </div>
      <div className="mt-3 space-y-1 text-sm text-[#2f2a24]">
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
      <div className="mt-3 border-t border-[#eadfce] pt-3 text-xs text-[#5b5247]">
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
      <div className="flex h-64 items-center justify-center text-[#9b9287]">
        No monthly cost data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 36, left: 20, bottom: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d9ccb8" opacity={0.6} />
        <XAxis dataKey="month" stroke="#8b7f70" fontSize={12} />
        <YAxis stroke="#8b7f70" fontSize={12} tickFormatter={formatCurrency} width={90} />
        <Tooltip content={<MonthlyTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="actualTotal"
          name="Actual Claims & Expenses"
          fill="#a7d8c1"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
        <Line
          type="monotone"
          dataKey="budget"
          name="Budget (PEPM × EE)"
          stroke="#c75237"
          strokeWidth={2}
          dot={{ fill: '#c75237', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default MonthlyActualBudgetChart
