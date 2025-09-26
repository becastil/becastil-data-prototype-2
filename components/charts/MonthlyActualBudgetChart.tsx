'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
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
  visibleRange?: {
    start?: string | null
    end?: string | null
  }
  focusMonth?: string | null
  onMonthFocus?: (rawMonth: string | null) => void
  onMonthSelect?: (rawMonth: string) => void
  onRangeChange?: (start: string, end: string) => void
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
  return (
    <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[var(--muted-background)] p-4 shadow-lg shadow-indigo-500/5">
      <div className="text-sm font-semibold text-[var(--foreground)]">
        {formatMonthLabel(point.rawMonth)}
      </div>
      <div className="mt-3 space-y-1 text-sm text-[var(--foreground)]">
        <div className="flex items-center justify-between">
          <span>Actual</span>
          <span>{formatCurrency(point.actualTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Budget (PEPM × EE)</span>
          <span>{formatCurrency(point.budget)}</span>
        </div>
        <div className="flex items-center justify-between text-[var(--foreground)]">
          <span>Variance vs Budget</span>
          <span>{formatVariance(point.variance)}</span>
        </div>
      </div>
      <div className="mt-3 border-t border-[color:var(--surface-border)] pt-3 text-xs text-[var(--foreground)]/75">
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

export function MonthlyActualBudgetChart({
  data,
  height = 400,
  visibleRange,
  focusMonth = null,
  onMonthFocus,
  onMonthSelect,
  onRangeChange,
}: MonthlyActualBudgetChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--foreground)]/60">
        No monthly cost data available.
      </div>
    )
  }

  const startIndex = visibleRange?.start
    ? Math.max(0, data.findIndex(point => point.rawMonth === visibleRange.start))
    : 0
  const endIndex = visibleRange?.end
    ? Math.max(0, data.findIndex(point => point.rawMonth === visibleRange.end))
    : data.length - 1

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 24, right: 36, left: 16, bottom: 32 }}
        onMouseMove={state => {
          if (!onMonthFocus) return
          const payload = state?.activePayload?.[0]?.payload as MonthlyActualBudgetPoint | undefined
          const month = payload?.rawMonth ?? null
          if (month !== focusMonth) {
            onMonthFocus(month)
          }
        }}
        onMouseLeave={() => onMonthFocus?.(null)}
        onClick={state => {
          if (!onMonthSelect) return
          const payload = state?.activePayload?.[0]?.payload as MonthlyActualBudgetPoint | undefined
          if (payload?.rawMonth) {
            onMonthSelect(payload.rawMonth)
          }
        }}
      >
        <defs>
          <linearGradient id="actualBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(99, 102, 241, 0.18)" />
        <XAxis
          dataKey="month"
          stroke="rgba(15, 23, 42, 0.55)"
          fontSize={12}
          tickMargin={8}
        />
        <YAxis
          stroke="rgba(15, 23, 42, 0.45)"
          fontSize={12}
          tickFormatter={formatCurrency}
          width={90}
        />
        <Tooltip content={<MonthlyTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.35)', strokeDasharray: '4 8' }} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: 'rgba(15,23,42,0.6)' }}
        />
        <Bar
          dataKey="actualTotal"
          name="Actual Claims & Expenses"
          radius={[8, 8, 0, 0]}
          maxBarSize={48}
        >
          {data.map(point => {
            const inRange = (() => {
              if (!visibleRange?.start || !visibleRange?.end) return true
              return point.rawMonth >= visibleRange.start && point.rawMonth <= visibleRange.end
            })()
            const isFocused = focusMonth === point.rawMonth
            return (
              <Cell
                key={point.rawMonth}
                fill="url(#actualBarGradient)"
                fillOpacity={inRange ? (isFocused ? 1 : 0.85) : 0.25}
                stroke={isFocused ? 'var(--accent)' : undefined}
                strokeWidth={isFocused ? 2 : 0}
              />
            )
          })}
        </Bar>
        <Line
          type="monotone"
          dataKey="budget"
          name="Budget (PEPM × EE)"
          stroke="#F97316"
          strokeWidth={3}
          dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
          activeDot={props => {
            const rawMonth = (props.payload as MonthlyActualBudgetPoint | undefined)?.rawMonth
            const isActive = focusMonth === rawMonth
            return (
              <circle
                cx={props.cx}
                cy={props.cy}
                r={isActive ? 7 : 5}
                stroke="#F97316"
                strokeWidth={isActive ? 3 : 2}
                fill={isActive ? '#fff' : '#F97316'}
              />
            )
          }}
        />
        <Brush
          dataKey="month"
          height={28}
          startIndex={startIndex < 0 ? 0 : startIndex}
          endIndex={endIndex < 0 ? data.length - 1 : endIndex}
          travellerWidth={12}
          stroke="rgba(37,99,235,0.45)"
          fill="rgba(37,99,235,0.08)"
          onChange={range => {
            if (!onRangeChange) return
            const start = data[range.startIndex]?.rawMonth
            const end = data[range.endIndex]?.rawMonth
            if (start && end) {
              onRangeChange(start, end)
            }
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export default MonthlyActualBudgetChart
