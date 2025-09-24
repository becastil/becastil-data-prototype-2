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
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
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
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="month" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickFormatter={formatPercent}
            domain={[0, 'dataMax + 20']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.375rem',
              color: '#F9FAFB'
            }}
            formatter={(value: any, name: string) => {
              return [formatPercent(value), name === 'lossRatio' ? 'Monthly Loss Ratio' : 'Rolling-12 Loss Ratio']
            }}
          />
          
          {/* Reference lines */}
          <ReferenceLine y={100} stroke="#F59E0B" strokeDasharray="5 5" label="100% Break-even" />
          <ReferenceLine y={80} stroke="#10B981" strokeDasharray="3 3" label="80% Target" />
          
          {/* Monthly Loss Ratio */}
          <Line
            type="monotone"
            dataKey="lossRatio"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            name="lossRatio"
          />
          
          {/* Rolling-12 Loss Ratio (if available) */}
          {chartData.some(d => d.r12LossRatio !== null) && (
            <Line
              type="monotone"
              dataKey="r12LossRatio"
              stroke="#EF4444"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              connectNulls={false}
              name="r12LossRatio"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400">Latest Ratio</div>
            <div className={`font-medium ${
              chartData[chartData.length - 1]?.lossRatio > 100 
                ? 'text-red-600 dark:text-red-400'
                : chartData[chartData.length - 1]?.lossRatio > 80
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {formatPercent(chartData[chartData.length - 1]?.lossRatio || 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Average Ratio</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {formatPercent(chartData.reduce((sum, d) => sum + d.lossRatio, 0) / chartData.length)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Trend</div>
            <div className={`font-medium ${
              chartData.length > 1 && 
              chartData[chartData.length - 1].lossRatio > chartData[chartData.length - 2].lossRatio
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
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