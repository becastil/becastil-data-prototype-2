'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar
} from 'recharts'

export default function DepartmentExpenseChart() {
  const data = useMemo(
    () => [
      { 
        department: 'Cardiology', 
        medical: 1250000, 
        pharmacy: 450000, 
        administrative: 35000,
        total: 1735000
      },
      { 
        department: 'Oncology', 
        medical: 1850000, 
        pharmacy: 720000, 
        administrative: 42000,
        total: 2612000
      },
      { 
        department: 'Emergency', 
        medical: 980000, 
        pharmacy: 180000, 
        administrative: 28000,
        total: 1188000
      },
      { 
        department: 'Surgery', 
        medical: 1650000, 
        pharmacy: 290000, 
        administrative: 38000,
        total: 1978000
      },
      { 
        department: 'Pediatrics', 
        medical: 420000, 
        pharmacy: 125000, 
        administrative: 18000,
        total: 563000
      },
      { 
        department: 'Mental Health', 
        medical: 650000, 
        pharmacy: 380000, 
        administrative: 22000,
        total: 1052000
      },
      { 
        department: 'Orthopedics', 
        medical: 890000, 
        pharmacy: 95000, 
        administrative: 25000,
        total: 1010000
      }
    ],
    []
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="department" 
          tickLine={false} 
          axisLine={{ stroke: '#e5e7eb' }}
          fontSize={10}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={formatCurrency}
          fontSize={10}
          width={70}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Bar
          dataKey="medical"
          name="Medical"
          stackId="a"
          fill="rgba(59, 130, 246, 0.8)"
          stroke="rgba(37, 99, 235, 1)"
          strokeWidth={1}
        />
        <Bar
          dataKey="pharmacy"
          name="Pharmacy"
          stackId="a"
          fill="rgba(249, 115, 22, 0.8)"
          stroke="rgba(234, 88, 12, 1)"
          strokeWidth={1}
        />
        <Bar
          dataKey="administrative"
          name="Administrative"
          stackId="a"
          fill="rgba(156, 163, 175, 0.8)"
          stroke="rgba(107, 114, 128, 1)"
          strokeWidth={1}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}