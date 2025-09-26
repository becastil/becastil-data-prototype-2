'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { MonthlySummary } from '@/lib/schemas/fees'

interface LossRatioTrendChartProps {
  summaries: MonthlySummary[]
  height?: number
}

export function LossRatioTrendChart({ summaries, height = 350 }: LossRatioTrendChartProps) {
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }
  
  // Prepare data - convert to percentages and filter out null values
  const chartData = summaries
    .filter(s => s.lossRatio !== null)
    .map(s => ({
      month: s.month,
      lossRatio: s.lossRatio! * 100, // Convert to percentage
      r12LossRatio: s.r12LossRatio ? s.r12LossRatio * 100 : null,
    }))
  
  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--foreground)]/60">
        No loss ratio data available
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height - 60}>
        <LineChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(99, 102, 241, 0.16)" />
          <XAxis 
            dataKey="month" 
            stroke="rgba(15, 23, 42, 0.55)"
            fontSize={12}
          />
          <YAxis 
            stroke="rgba(15, 23, 42, 0.45)"
            fontSize={12}
            tickFormatter={formatPercent}
            domain={[0, 'dataMax + 20']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--muted-background)',
              border: '1px solid var(--surface-border)',
              borderRadius: '0.75rem',
              color: 'var(--foreground)'
            }}
            formatter={(value: any, name: string) => {
              return [formatPercent(value), name === 'lossRatio' ? 'Monthly Loss Ratio' : 'Rolling-12 Loss Ratio']
            }}
          />
          
          {/* Reference lines */}
          <ReferenceLine y={100} stroke="#F97316" strokeDasharray="6 6" label="100% Break-even" />
          <ReferenceLine y={80} stroke="#22D3EE" strokeDasharray="4 4" label="80% Target" />
          
          {/* Monthly Loss Ratio */}
          <Line
            type="monotone"
            dataKey="lossRatio"
            stroke="#6366F1"
            strokeWidth={3}
            dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
            name="lossRatio"
          />
          
          {/* Rolling-12 Loss Ratio (if available) */}
          {chartData.some(d => d.r12LossRatio !== null) && (
            <Line
              type="monotone"
              dataKey="r12LossRatio"
              stroke="#EC4899"
              strokeWidth={2.5}
              strokeDasharray="8 4"
              dot={{ fill: '#EC4899', strokeWidth: 2, r: 4 }}
              connectNulls={false}
              name="r12LossRatio"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[var(--muted-background)]/80 p-4 shadow-inner">
        <div className="grid grid-cols-1 gap-4 text-sm text-[var(--foreground)]/75 sm:grid-cols-3">
          <div>
            <div className="text-[var(--foreground)]/60">Latest Ratio</div>
            <div className={`text-lg font-semibold ${
              chartData[chartData.length - 1]?.lossRatio > 100 
                ? 'text-[#EF4444]'
                : chartData[chartData.length - 1]?.lossRatio > 80
                ? 'text-[#F59E0B]'
                : 'text-[#22C55E]'
            }`}>
              {formatPercent(chartData[chartData.length - 1]?.lossRatio || 0)}
            </div>
          </div>
          <div>
            <div className="text-[var(--foreground)]/60">Average Ratio</div>
            <div className="text-lg font-semibold text-[var(--foreground)]">
              {formatPercent(chartData.reduce((sum, d) => sum + d.lossRatio, 0) / chartData.length)}
            </div>
          </div>
          <div>
            <div className="text-[var(--foreground)]/60">Trend</div>
            <div className={`text-lg font-semibold ${
              chartData.length > 1 && 
              chartData[chartData.length - 1].lossRatio > chartData[chartData.length - 2].lossRatio
                ? 'text-[#EF4444]'
                : 'text-[#22C55E]'
            }`}>
              {chartData.length > 1 
                ? (chartData[chartData.length - 1].lossRatio > chartData[chartData.length - 2].lossRatio ? '↗ Rising' : '↘ Falling')
                : '— No trend'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
