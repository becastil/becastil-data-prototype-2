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
      <div className="flex h-64 flex-col items-center justify-center text-center text-[#9b9287]">
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
        <CartesianGrid strokeDasharray="3 3" stroke="#d9ccb8" opacity={0.6} />
        <XAxis type="number" stroke="#8b7f70" fontSize={12} tickFormatter={value => numberFormatter.format(Number(value))} />
        <YAxis type="category" dataKey="label" stroke="#8b7f70" fontSize={12} width={120} tick={{ fontSize: 12 }} />
        <Tooltip
          cursor={{ fill: 'rgba(199, 82, 55, 0.08)' }}
          contentStyle={{
            backgroundColor: '#fdf9f2',
            border: '1px solid #eadfce',
            borderRadius: '0.5rem',
            color: '#2f2a24',
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
        <Bar dataKey="count" fill="#c75237" radius={[4, 4, 4, 4]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default HighCostBandsChart
