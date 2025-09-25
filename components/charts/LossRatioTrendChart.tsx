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
      <div className="flex items-center justify-center h-64 text-[#9b9287]">
        No loss ratio data available
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height - 80}>
        <LineChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#d9ccb8" opacity={0.6} />
          <XAxis 
            dataKey="month" 
            stroke="#8b7f70"
            fontSize={12}
          />
          <YAxis 
            stroke="#8b7f70"
            fontSize={12}
            tickFormatter={formatPercent}
            domain={[0, 'dataMax + 20']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fdf9f2',
              border: '1px solid #eadfce',
              borderRadius: '0.5rem',
              color: '#2f2a24'
            }}
            formatter={(value: any, name: string) => {
              return [formatPercent(value), name === 'lossRatio' ? 'Monthly Loss Ratio' : 'Rolling-12 Loss Ratio']
            }}
          />
          
          {/* Reference lines */}
          <ReferenceLine y={100} stroke="#b3872a" strokeDasharray="5 5" label="100% Break-even" />
          <ReferenceLine y={80} stroke="#2f6d55" strokeDasharray="3 3" label="80% Target" />
          
          {/* Monthly Loss Ratio */}
          <Line
            type="monotone"
            dataKey="lossRatio"
            stroke="#2f6d55"
            strokeWidth={2}
            dot={{ fill: '#2f6d55', strokeWidth: 2, r: 4 }}
            name="lossRatio"
          />
          
          {/* Rolling-12 Loss Ratio (if available) */}
          {chartData.some(d => d.r12LossRatio !== null) && (
            <Line
              type="monotone"
              dataKey="r12LossRatio"
              stroke="#c75237"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={{ fill: '#c75237', strokeWidth: 2, r: 4 }}
              connectNulls={false}
              name="r12LossRatio"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="bg-[#f3ede2] rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 text-sm text-[#4f463b]">
          <div>
            <div className="text-[#5b5247]">Latest Ratio</div>
            <div className={`font-medium ${
              chartData[chartData.length - 1]?.lossRatio > 100 
                ? 'text-[#c75237]'
                : chartData[chartData.length - 1]?.lossRatio > 80
                ? 'text-[#b3872a]'
                : 'text-[#2f6d55]'
            }`}>
              {formatPercent(chartData[chartData.length - 1]?.lossRatio || 0)}
            </div>
          </div>
          <div>
            <div className="text-[#5b5247]">Average Ratio</div>
            <div className="font-medium text-[#2f2a24]">
              {formatPercent(chartData.reduce((sum, d) => sum + d.lossRatio, 0) / chartData.length)}
            </div>
          </div>
          <div>
            <div className="text-[#5b5247]">Trend</div>
            <div className={`font-medium ${
              chartData.length > 1 && 
              chartData[chartData.length - 1].lossRatio > chartData[chartData.length - 2].lossRatio
                ? 'text-[#c75237]'
                : 'text-[#2f6d55]'
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
