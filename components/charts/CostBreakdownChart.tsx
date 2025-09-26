'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface CostBreakdownChartProps {
  financialMetrics: Array<{
    totalMedicalClaims: number
    totalRxClaims: number
    totalAdminFees: number
    stopLossReimbursement?: number
  }>
  height?: number
}

const COLORS = [
  '#6366F1', // Medical - Indigo
  '#EC4899', // Rx - Pink
  '#14B8A6', // Admin - Teal
  '#F59E0B', // Stop Loss - Amber
]

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

export function CostBreakdownChart({ financialMetrics, height = 400 }: CostBreakdownChartProps) {
  const chartData = useMemo(() => {
    const totals = financialMetrics.reduce(
      (acc, metric) => ({
        medicalClaims: acc.medicalClaims + metric.totalMedicalClaims,
        rxClaims: acc.rxClaims + metric.totalRxClaims,
        adminFees: acc.adminFees + metric.totalAdminFees,
        stopLossReimbursement: acc.stopLossReimbursement + Math.abs(metric.stopLossReimbursement || 0),
      }),
      { medicalClaims: 0, rxClaims: 0, adminFees: 0, stopLossReimbursement: 0 }
    )

    const grandTotal = totals.medicalClaims + totals.rxClaims + totals.adminFees + totals.stopLossReimbursement
    
    if (grandTotal === 0) return []

    const data = [
      {
        name: 'Medical Claims',
        value: totals.medicalClaims,
        percentage: (totals.medicalClaims / grandTotal) * 100,
      },
      {
        name: 'Rx Claims',
        value: totals.rxClaims,
        percentage: (totals.rxClaims / grandTotal) * 100,
      },
      {
        name: 'Administrative Fees',
        value: totals.adminFees,
        percentage: (totals.adminFees / grandTotal) * 100,
      },
    ]

    // Only add Stop Loss if there's significant reimbursement
    if (totals.stopLossReimbursement > 0) {
      data.push({
        name: 'Stop-Loss Recovery',
        value: totals.stopLossReimbursement,
        percentage: (totals.stopLossReimbursement / grandTotal) * 100,
      })
    }

    return data.filter(item => item.value > 0)
  }, [financialMetrics])

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--foreground)]/60">
        No cost breakdown data available.
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      return (
        <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[var(--muted-background)] p-4 shadow-lg shadow-indigo-500/5">
          <div className="font-semibold text-[var(--foreground)]">{data.name}</div>
          <div className="mt-2 text-sm text-[var(--foreground)]/75">
            <div>{formatCurrency(data.value)}</div>
            <div>{formatPercent(data.percentage)} of total</div>
          </div>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm text-[var(--foreground)]/70">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[var(--foreground)]/70">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height - 80}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {chartData.map((item, index) => (
          <div key={item.name} className="rounded-2xl border border-[color:var(--surface-border)] bg-[var(--muted-background)]/70 p-3 text-center shadow-sm">
            <div
              className="h-3 w-12 mx-auto mb-2 rounded"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <div className="font-medium text-[var(--foreground)]">{formatCurrency(item.value)}</div>
            <div className="text-xs text-[var(--foreground)]/60">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
