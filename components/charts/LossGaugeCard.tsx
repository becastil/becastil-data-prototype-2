'use client'

import { useMemo } from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface LossGaugeCardProps {
  fuelPercent: number | null
  stopLossPercent: number
  mode: 'fuel' | 'stopLoss'
  onModeChange: (mode: 'fuel' | 'stopLoss') => void
}

const GaugeBackground = () => (
  <RadialBar
    dataKey="max"
    cornerRadius={30}
    fill="#d1d5db"
    stroke="none"
  />
)

function computeFuelColor(percent: number | null) {
  if (percent === null) return '#94a3b8'
  if (percent < 95) return '#16a34a'
  if (percent <= 105) return '#facc15'
  return '#dc2626'
}

export function LossGaugeCard({ fuelPercent, stopLossPercent, mode, onModeChange }: LossGaugeCardProps) {
  const clampedFuel = fuelPercent === null ? null : Math.min(Math.max(fuelPercent, 0), 200)
  const clampedStopLoss = Math.min(Math.max(stopLossPercent, 0), 200)

  const activeFuelValue = clampedFuel ?? 0

  const data = useMemo(() => {
    const value = mode === 'fuel' ? activeFuelValue : clampedStopLoss
    return [
      { name: 'value', value },
      { name: 'max', max: 200 },
    ]
  }, [mode, activeFuelValue, clampedStopLoss])

  const gaugeColor = useMemo(() => {
    return mode === 'fuel' ? computeFuelColor(fuelPercent) : '#2563eb'
  }, [mode, fuelPercent])

  const label = mode === 'fuel' ? 'Cumulative vs Budget' : 'Stop-Loss Reimbursement %'
  const helper =
    mode === 'fuel'
      ? 'Latest cumulative spend as a % of budget. Aim for 100%; 95-105% is caution.'
      : 'Share of claim dollars reimbursed through stop-loss coverage.'

  const valueLabel = mode === 'fuel'
    ? fuelPercent !== null
      ? `${fuelPercent.toFixed(1)}%`
      : '—'
    : `${clampedStopLoss.toFixed(1)}%`

  const secondaryText = mode === 'fuel'
    ? fuelPercent !== null
      ? `${fuelPercent - 100 >= 0 ? '+' : ''}${(fuelPercent - 100).toFixed(1)}% vs plan`
      : 'Awaiting budget inputs'
    : 'Year-to-date'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onModeChange('fuel')}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition-colors ${
            mode === 'fuel'
              ? 'border-[color:var(--foreground)] bg-[var(--foreground)] text-[var(--muted-background)]'
              : 'border-[color:var(--surface-border)] text-[var(--foreground)] hover:border-[color:var(--foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Fuel Gauge
        </button>
        <button
          type="button"
          onClick={() => onModeChange('stopLoss')}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition-colors ${
            mode === 'stopLoss'
              ? 'border-[color:var(--foreground)] bg-[var(--foreground)] text-[var(--muted-background)]'
              : 'border-[color:var(--surface-border)] text-[var(--foreground)] hover:border-[color:var(--foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Stop-Loss
        </button>
      </div>

      <div className="relative flex h-56 items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="60%"
            outerRadius="110%"
            barSize={16}
            data={data}
            startAngle={220}
            endAngle={-40}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 200]}
              tick={false}
            />
            <GaugeBackground />
            <RadialBar
              dataKey="value"
              cornerRadius={16}
              fill={gaugeColor}
              clockWise
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--foreground)] opacity-60">
            {label}
          </span>
          <span className="mt-2 text-3xl font-bold text-[var(--foreground)] tabular-nums">
            {valueLabel}
          </span>
          <span className="mt-1 text-[11px] uppercase tracking-[0.35em] text-[var(--foreground)] opacity-50">
            {secondaryText}
          </span>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[var(--foreground)] opacity-70">
        {helper}
      </p>
    </div>
  )
}

export default LossGaugeCard
