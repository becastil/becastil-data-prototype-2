'use client'

import { useMemo } from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface LossGaugeCardProps {
  lossRatioPercent: number
  stopLossPercent: number
  mode: 'loss' | 'stopLoss'
  onModeChange: (mode: 'loss' | 'stopLoss') => void
}

const GaugeBackground = () => (
  <RadialBar
    dataKey="max"
    cornerRadius={30}
    fill="#e5e7eb"
    stroke="none"
  />
)

export function LossGaugeCard({ lossRatioPercent, stopLossPercent, mode, onModeChange }: LossGaugeCardProps) {
  const clampedLoss = Math.min(Math.max(lossRatioPercent, 0), 200)
  const clampedStopLoss = Math.min(Math.max(stopLossPercent, 0), 200)

  const data = useMemo(() => {
    const value = mode === 'loss' ? clampedLoss : clampedStopLoss
    return [
      { name: 'value', value },
      { name: 'max', max: 200 },
    ]
  }, [mode, clampedLoss, clampedStopLoss])

  const label = mode === 'loss' ? 'YTD Loss Ratio' : 'Stop-Loss Reimbursement %'
  const helper =
    mode === 'loss'
      ? 'Target is 100%. Values above 100% indicate higher claim costs.'
      : 'Share of claims recovered through stop-loss coverage.'

  const displayValue = mode === 'loss' ? clampedLoss : clampedStopLoss

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onModeChange('loss')}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition-colors ${
            mode === 'loss'
              ? 'border-black bg-black text-white'
              : 'border-black/40 text-black/60 hover:border-black hover:text-black'
          }`}
        >
          Fuel Gauge
        </button>
        <button
          type="button"
          onClick={() => onModeChange('stopLoss')}
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition-colors ${
            mode === 'stopLoss'
              ? 'border-black bg-black text-white'
              : 'border-black/40 text-black/60 hover:border-black hover:text-black'
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
              background
              dataKey="value"
              cornerRadius={16}
              fill="#111827"
              clockWise
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60">
            {label}
          </span>
          <span className="mt-2 text-3xl font-bold text-black tabular-nums">
            {displayValue.toFixed(1)}%
          </span>
          <span className="mt-1 text-[11px] uppercase tracking-[0.35em] text-black/40">
            YTD
          </span>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-black/60">
        {helper}
      </p>
    </div>
  )
}

export default LossGaugeCard
