'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TopClaimant } from '@/lib/schemas/fees'

interface TopClaimantsChartProps {
  claimants: TopClaimant[]
  height?: number
  activeClaimantId?: string | null
  onClaimantFocus?: (memberId: string | null) => void
  onClaimantSelect?: (claimant: TopClaimant) => void
}

export function TopClaimantsChart({
  claimants,
  height = 350,
  activeClaimantId = null,
  onClaimantFocus,
  onClaimantSelect,
}: TopClaimantsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }
  
  // Colors for the bars - gradient from high to low impact
  const getBarColor = (index: number) => {
    const colors = [
      '#6366F1',
      '#8B5CF6',
      '#EC4899',
      '#F97316',
      '#22D3EE',
      '#14B8A6',
      '#F59E0B',
      '#0EA5E9',
      '#A855F7',
      '#F472B6',
    ]
    return colors[index % colors.length]
  }
  
  if (claimants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#9b9287]">
        No claimant data available
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height - 80}>
        <BarChart 
          data={claimants}
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(99,102,241,0.14)" />
          <XAxis 
            type="number"
            stroke="rgba(15,23,42,0.55)"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <YAxis 
            type="category"
            dataKey="memberId"
            stroke="rgba(15,23,42,0.45)"
            fontSize={12}
            width={55}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--muted-background)',
              border: '1px solid var(--surface-border)',
              borderRadius: '0.75rem',
              color: 'var(--foreground)'
            }}
            formatter={(value: any, name: string, props: any) => {
              const data = props.payload
              if (name === 'totalAmount') {
                return [
                  <div key="tooltip">
                    <div>{formatCurrency(value)} ({formatPercent(data.percentage)})</div>
                    <div className="text-sm opacity-75">{data.claimCount} claims</div>
                  </div>,
                  'Total Claims'
                ]
              }
              return [value, name]
            }}
          />
          <Bar dataKey="totalAmount" radius={[6, 6, 6, 6]}>
            {claimants.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(index)}
                fillOpacity={activeClaimantId === entry.memberId ? 1 : 0.65}
                stroke={activeClaimantId === entry.memberId ? 'var(--accent)' : undefined}
                strokeWidth={activeClaimantId === entry.memberId ? 2 : 0}
                onMouseEnter={() => onClaimantFocus?.(entry.memberId)}
                onMouseLeave={() => onClaimantFocus?.(null)}
                onClick={() => onClaimantSelect?.(entry)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[var(--muted-background)]/80 p-4">
        <div className="grid grid-cols-1 gap-4 text-sm text-[var(--foreground)]/75 sm:grid-cols-2">
          <div>
            <div className="text-[var(--foreground)]/60">Top 3 Members</div>
            <div className="text-lg font-semibold text-[var(--foreground)]">
              {formatPercent(claimants.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0))} of total
            </div>
          </div>
          <div>
            <div className="text-[var(--foreground)]/60">Highest Single</div>
            <div className="text-lg font-semibold text-[var(--foreground)]">
              {claimants[0] ? formatCurrency(claimants[0].totalAmount) : '$0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
