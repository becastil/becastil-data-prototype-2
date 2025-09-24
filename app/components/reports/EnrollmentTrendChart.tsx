'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line
} from 'recharts'

export default function EnrollmentTrendChart() {
  const data = useMemo(
    () => [
      { month: 'Jan', totalMembers: 2845, basicPlan: 1520, premiumPlan: 890, familyPlan: 435 },
      { month: 'Feb', totalMembers: 2912, basicPlan: 1565, premiumPlan: 920, familyPlan: 427 },
      { month: 'Mar', totalMembers: 2978, basicPlan: 1598, premiumPlan: 945, familyPlan: 435 },
      { month: 'Apr', totalMembers: 3056, basicPlan: 1632, premiumPlan: 978, familyPlan: 446 },
      { month: 'May', totalMembers: 3134, basicPlan: 1675, premiumPlan: 1012, familyPlan: 447 },
      { month: 'Jun', totalMembers: 3201, basicPlan: 1710, premiumPlan: 1038, familyPlan: 453 },
      { month: 'Jul', totalMembers: 3289, basicPlan: 1756, premiumPlan: 1065, familyPlan: 468 },
      { month: 'Aug', totalMembers: 3345, basicPlan: 1789, premiumPlan: 1087, familyPlan: 469 },
      { month: 'Sep', totalMembers: 3412, basicPlan: 1823, premiumPlan: 1115, familyPlan: 474 },
      { month: 'Oct', totalMembers: 3478, basicPlan: 1856, premiumPlan: 1143, familyPlan: 479 },
      { month: 'Nov', totalMembers: 3534, basicPlan: 1889, premiumPlan: 1167, familyPlan: 478 },
      { month: 'Dec', totalMembers: 3587, basicPlan: 1912, premiumPlan: 1195, familyPlan: 480 }
    ],
    []
  )

  const formatNumber = (value: number) => value.toLocaleString()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="month" 
          tickLine={false} 
          axisLine={{ stroke: '#e5e7eb' }}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={formatNumber}
          fontSize={12}
          width={50}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatNumber(value), name]}
          cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Line
          type="monotone"
          dataKey="totalMembers"
          name="Total Members"
          stroke="#1f2937"
          strokeWidth={3}
          dot={{ r: 3, fill: '#1f2937' }}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="basicPlan"
          name="Basic Plan"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 2, fill: '#3b82f6' }}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="premiumPlan"
          name="Premium Plan"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 2, fill: '#f59e0b' }}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="familyPlan"
          name="Family Plan"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 2, fill: '#10b981' }}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}