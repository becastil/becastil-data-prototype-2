'use client'

import { useMemo } from 'react'
import { SimpleKPICard } from './SimpleKPICard'

interface KPIDashboardProps {
  financialMetrics: Array<{
    month: string
    monthlyClaimsAndExpenses: number
    totalMedicalClaims: number
    totalRxClaims: number
    totalAdminFees: number
    stopLossReimbursement?: number
    eeCount: number
    monthlyBudget: number
  }>
  summaries: Array<{
    claims: number
    premium: number
  }>
  className?: string
}

export function KPIDashboard({ financialMetrics, summaries, className = '' }: KPIDashboardProps) {
  const kpiData = useMemo(() => {
    if (financialMetrics.length === 0) {
      return {
        totalClaims: 0,
        avgCostPerEE: 0,
        currentLossRatio: 0,
        stopLossRecovery: 0,
        totalEnrolled: 0,
        budgetVariance: 0,
      }
    }

    const totalClaims = summaries.reduce((sum, summary) => sum + summary.claims, 0)
    const totalPremium = summaries.reduce((sum, summary) => sum + summary.premium, 0)
    const currentLossRatio = totalPremium > 0 ? (totalClaims / totalPremium) : 0

    const latestMetric = financialMetrics[financialMetrics.length - 1]
    const avgCostPerEE = latestMetric.eeCount > 0 ? latestMetric.monthlyClaimsAndExpenses / latestMetric.eeCount : 0
    
    const stopLossRecovery = financialMetrics.reduce((sum, metric) => sum + Math.abs(metric.stopLossReimbursement || 0), 0)
    
    const totalBudget = financialMetrics.reduce((sum, metric) => sum + metric.monthlyBudget, 0)
    const totalActual = financialMetrics.reduce((sum, metric) => sum + metric.monthlyClaimsAndExpenses, 0)
    const budgetVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) : 0

    return {
      totalClaims,
      avgCostPerEE,
      currentLossRatio,
      stopLossRecovery,
      totalEnrolled: latestMetric.eeCount,
      budgetVariance,
    }
  }, [financialMetrics, summaries])

  const getPreviousMonthComparison = (currentValue: number, metricKey: keyof typeof kpiData) => {
    if (financialMetrics.length < 2) return undefined
    
    const current = financialMetrics[financialMetrics.length - 1]
    const previous = financialMetrics[financialMetrics.length - 2]
    
    let currentVal = currentValue
    let previousVal = 0
    
    switch (metricKey) {
      case 'avgCostPerEE':
        previousVal = previous.eeCount > 0 ? previous.monthlyClaimsAndExpenses / previous.eeCount : 0
        break
      case 'totalEnrolled':
        previousVal = previous.eeCount
        break
      default:
        return undefined
    }
    
    if (previousVal === 0) return undefined
    return ((currentVal - previousVal) / previousVal) * 100
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SimpleKPICard
          title="Total Claims YTD"
          value={kpiData.totalClaims}
          format="currency"
          icon="claims"
        />
        
        <SimpleKPICard
          title="Avg Cost Per Employee"
          value={kpiData.avgCostPerEE}
          format="currency"
          icon="average"
          change={getPreviousMonthComparison(kpiData.avgCostPerEE, 'avgCostPerEE')}
        />
        
        <SimpleKPICard
          title="Current Loss Ratio"
          value={kpiData.currentLossRatio}
          format="percentage"
          icon="ratio"
        />
        
        <SimpleKPICard
          title="Stop-Loss Recovery"
          value={kpiData.stopLossRecovery}
          format="currency"
          icon="cost"
        />
        
        <SimpleKPICard
          title="Total Enrolled"
          value={kpiData.totalEnrolled}
          format="number"
          icon="sessions"
          change={getPreviousMonthComparison(kpiData.totalEnrolled, 'totalEnrolled')}
        />
        
        <SimpleKPICard
          title="Budget Variance"
          value={kpiData.budgetVariance}
          format="percentage"
          icon="ratio"
        />
      </div>
    </div>
  )
}