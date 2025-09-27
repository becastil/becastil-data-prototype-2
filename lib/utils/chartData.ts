'use client'

import type { ExperienceRow } from '@/lib/schemas/experience'
import type { HighCostClaimant } from '@/lib/schemas/highCost'

export interface MonthlyActualBudgetData {
  month: string
  actualExpense: number
  actualClaims: number
  budgetTotal: number
  variance: number
}

export interface LossRatioData {
  month: string
  lossRatio: number
  r12LossRatio: number
  premium: number
  claims: number
}

export interface PremiumClaimsData {
  month: string
  premium: number
  medicalClaims: number
  rxClaims: number
  totalClaims: number
  ratio: number
}

export interface CostDriverData {
  category: string
  amount: number
  percentage: number
  changeFromPrevious: number
  trend: 'up' | 'down' | 'neutral'
}

export interface MemberDistributionData {
  ageRange: string
  memberCount: number
  totalCost: number
  avgCostPerMember: number
  percentage: number
}

export interface ConditionsData {
  condition: string
  memberCount: number
  totalCost: number
  avgCostPerMember: number
  percentage: number
  subcategories: Array<{
    name: string
    cost: number
    percentage: number
  }>
}

/**
 * Transform experience data for Monthly Actual vs Budget combo chart
 */
export function transformMonthlyActualBudgetData(
  experienceData: ExperienceRow[]
): MonthlyActualBudgetData[] {
  const monthlyData = new Map<string, Partial<MonthlyActualBudgetData>>()

  experienceData.forEach(row => {
    const key = row.month
    if (!monthlyData.has(key)) {
      monthlyData.set(key, { month: key, actualExpense: 0, actualClaims: 0, budgetTotal: 0, variance: 0 })
    }

    const data = monthlyData.get(key)!
    const category = row.category.toLowerCase()

    if (category.includes('expense') || category.includes('admin')) {
      data.actualExpense = (data.actualExpense || 0) + row.amount
    } else if (category.includes('claims') || category.includes('medical') || category.includes('rx')) {
      data.actualClaims = (data.actualClaims || 0) + row.amount
    } else if (category.includes('budget')) {
      data.budgetTotal = (data.budgetTotal || 0) + row.amount
    }
  })

  return Array.from(monthlyData.values())
    .map(data => ({
      ...data,
      variance: (data.actualExpense || 0) + (data.actualClaims || 0) - (data.budgetTotal || 0)
    } as MonthlyActualBudgetData))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Transform data for Loss Ratio trending
 */
export function transformLossRatioData(
  experienceData: ExperienceRow[]
): LossRatioData[] {
  const monthlyData = new Map<string, { premium: number; claims: number }>()

  experienceData.forEach(row => {
    const key = row.month
    if (!monthlyData.has(key)) {
      monthlyData.set(key, { premium: 0, claims: 0 })
    }

    const data = monthlyData.get(key)!
    const category = row.category.toLowerCase()

    if (category.includes('premium')) {
      data.premium += row.amount
    } else if (category.includes('claims') || category.includes('medical') || category.includes('rx')) {
      data.claims += row.amount
    }
  })

  const sortedData = Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))

  return sortedData.map(([month, data], index) => {
    const lossRatio = data.premium > 0 ? (data.claims / data.premium) * 100 : 0
    
    // Calculate 12-month rolling average
    const startIndex = Math.max(0, index - 11)
    const rollingData = sortedData.slice(startIndex, index + 1)
    const totalPremium = rollingData.reduce((sum, [, d]) => sum + d.premium, 0)
    const totalClaims = rollingData.reduce((sum, [, d]) => sum + d.claims, 0)
    const r12LossRatio = totalPremium > 0 ? (totalClaims / totalPremium) * 100 : 0

    return {
      month,
      lossRatio,
      r12LossRatio,
      premium: data.premium,
      claims: data.claims
    }
  })
}

/**
 * Transform data for Premium vs Claims comparison
 */
export function transformPremiumClaimsData(
  experienceData: ExperienceRow[]
): PremiumClaimsData[] {
  const monthlyData = new Map<string, { premium: number; medicalClaims: number; rxClaims: number }>()

  experienceData.forEach(row => {
    const key = row.month
    if (!monthlyData.has(key)) {
      monthlyData.set(key, { premium: 0, medicalClaims: 0, rxClaims: 0 })
    }

    const data = monthlyData.get(key)!
    const category = row.category.toLowerCase()

    if (category.includes('premium')) {
      data.premium += row.amount
    } else if (category.includes('medical')) {
      data.medicalClaims += row.amount
    } else if (category.includes('rx') || category.includes('pharmacy')) {
      data.rxClaims += row.amount
    }
  })

  return Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      premium: data.premium,
      medicalClaims: data.medicalClaims,
      rxClaims: data.rxClaims,
      totalClaims: data.medicalClaims + data.rxClaims,
      ratio: data.premium > 0 ? ((data.medicalClaims + data.rxClaims) / data.premium) * 100 : 0
    }))
}

/**
 * Transform data for cost drivers analysis
 */
export function transformCostDriversData(
  experienceData: ExperienceRow[]
): CostDriverData[] {
  const categoryTotals = new Map<string, number[]>()
  const months = Array.from(new Set(experienceData.map(row => row.month))).sort()

  experienceData.forEach(row => {
    if (!categoryTotals.has(row.category)) {
      categoryTotals.set(row.category, new Array(months.length).fill(0))
    }
    const monthIndex = months.indexOf(row.month)
    if (monthIndex >= 0) {
      categoryTotals.get(row.category)![monthIndex] += row.amount
    }
  })

  const totalCost = Array.from(categoryTotals.values())
    .reduce((sum, amounts) => sum + amounts.reduce((a, b) => a + b, 0), 0)

  return Array.from(categoryTotals.entries())
    .map(([category, amounts]) => {
      const total = amounts.reduce((a, b) => a + b, 0)
      const lastTwo = amounts.slice(-2)
      const changeFromPrevious = lastTwo.length === 2 && lastTwo[0] > 0
        ? ((lastTwo[1] - lastTwo[0]) / lastTwo[0]) * 100
        : 0

      return {
        category,
        amount: total,
        percentage: totalCost > 0 ? (total / totalCost) * 100 : 0,
        changeFromPrevious,
        trend: changeFromPrevious > 1 ? 'up' : changeFromPrevious < -1 ? 'down' : 'neutral' as const
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Transform high-cost claimant data for member distribution
 */
export function transformMemberDistributionData(
  highCostClaimants: HighCostClaimant[]
): MemberDistributionData[] {
  const ageRanges = ['0-17', '18-29', '30-39', '40-49', '50-59', '60+']
  const distributionMap = new Map<string, { members: Set<string>; totalCost: number }>()

  ageRanges.forEach(range => {
    distributionMap.set(range, { members: new Set(), totalCost: 0 })
  })

  highCostClaimants.forEach(claimant => {
    const ageBand = claimant.ageBand
    let range = '60+'
    
    if (ageBand.includes('0-17')) range = '0-17'
    else if (ageBand.includes('18-29')) range = '18-29'
    else if (ageBand.includes('30-39')) range = '30-39'
    else if (ageBand.includes('40-49')) range = '40-49'
    else if (ageBand.includes('50-59')) range = '50-59'

    const data = distributionMap.get(range)!
    data.members.add(claimant.memberId)
    data.totalCost += claimant.total
  })

  const totalMembers = highCostClaimants.length

  return ageRanges.map(range => {
    const data = distributionMap.get(range)!
    const memberCount = data.members.size
    
    return {
      ageRange: range,
      memberCount,
      totalCost: data.totalCost,
      avgCostPerMember: memberCount > 0 ? data.totalCost / memberCount : 0,
      percentage: totalMembers > 0 ? (memberCount / totalMembers) * 100 : 0
    }
  })
}

/**
 * Transform high-cost claimant data for conditions analysis
 */
export function transformConditionsData(
  highCostClaimants: HighCostClaimant[]
): ConditionsData[] {
  const conditionsMap = new Map<string, { 
    members: Set<string>
    totalCost: number
    subcategories: Map<string, number>
  }>()

  highCostClaimants.forEach(claimant => {
    const condition = claimant.primaryDiagnosisCategory
    const subCondition = claimant.specificDiagnosisShort
    
    if (!conditionsMap.has(condition)) {
      conditionsMap.set(condition, { 
        members: new Set(), 
        totalCost: 0, 
        subcategories: new Map() 
      })
    }

    const data = conditionsMap.get(condition)!
    data.members.add(claimant.memberId)
    data.totalCost += claimant.total
    
    const currentSubCost = data.subcategories.get(subCondition) || 0
    data.subcategories.set(subCondition, currentSubCost + claimant.total)
  })

  const totalCost = Array.from(conditionsMap.values())
    .reduce((sum, data) => sum + data.totalCost, 0)

  return Array.from(conditionsMap.entries())
    .map(([condition, data]) => {
      const memberCount = data.members.size
      const subcategories = Array.from(data.subcategories.entries())
        .map(([name, cost]) => ({
          name,
          cost,
          percentage: data.totalCost > 0 ? (cost / data.totalCost) * 100 : 0
        }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5) // Top 5 subcategories

      return {
        condition,
        memberCount,
        totalCost: data.totalCost,
        avgCostPerMember: memberCount > 0 ? data.totalCost / memberCount : 0,
        percentage: totalCost > 0 ? (data.totalCost / totalCost) * 100 : 0,
        subcategories
      }
    })
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 10) // Top 10 conditions
}

/**
 * Format currency values for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Format percentage values for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with compact notation
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}