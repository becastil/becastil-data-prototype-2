'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { ClaimantAmountBand } from '@/lib/calc/aggregations'

type HighCostBandsChartProps = {
  data: ClaimantAmountBand[]
  height?: number
}

const numberFormatter = new Intl.NumberFormat('en-US')
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function HighCostBandsChart({ data, height = 340 }: HighCostBandsChartProps) {
  const totalClaimants = data.reduce((sum, band) => sum + band.count, 0)

  if (totalClaimants === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center text-[var(--foreground)]/60">
        No high-cost claimant data available.
      </div>
    )
  }

  const enrichedData = data.map(band => ({
    ...band,
    share: totalClaimants > 0 ? (band.count / totalClaimants) * 100 : 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={enrichedData} layout="vertical" margin={{ top: 20, right: 24, left: 24, bottom: 12 }}>
        <defs>
          <linearGradient id="bandBarGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#A855F7" stopOpacity={0.9} />
            <stop offset="50%" stopColor="#6366F1" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(99,102,241,0.15)" />
        <XAxis type="number" stroke="rgba(15,23,42,0.55)" fontSize={12} tickFormatter={value => numberFormatter.format(Number(value))} />
        <YAxis type="category" dataKey="label" stroke="rgba(15,23,42,0.45)" fontSize={12} width={140} tick={{ fontSize: 12 }} />
        <Tooltip
          cursor={{ fill: 'rgba(17, 24, 39, 0.08)' }}
          contentStyle={{
            backgroundColor: 'var(--muted-background)',
            border: '1px solid var(--surface-border)',
            borderRadius: '0.75rem',
            color: 'var(--foreground)',
          }}
          formatter={(value: any, _name: string, props: any) => {
            if (props && props.payload) {
              const { totalAmount, share } = props.payload as { totalAmount: number; share: number }
              return [
                `${numberFormatter.format(Number(value))} members`,
                `${currencyFormatter.format(totalAmount)} paid • ${share.toFixed(1)}% of cohort`,
              ]
            }
            return value
          }}
          labelFormatter={label => `${label}`}
        />
        <Bar dataKey="count" fill="url(#bandBarGradient)" radius={[6, 6, 6, 6]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default HighCostBandsChart
