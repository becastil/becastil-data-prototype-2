import { ExperienceRow, MemberClaim } from '../schemas/experience'
import { CategoryTotal, TopClaimant, ChartDataPoint } from '../schemas/fees'

/**
 * Aggregate experience data by category
 */
export function aggregateByCategory(experience: ExperienceRow[]): CategoryTotal[] {
  const categoryTotals = experience.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + row.amount
    return acc
  }, {} as Record<string, number>)
  
  const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)
  
  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Aggregate experience data by month for charting
 */
export function aggregateByMonth(experience: ExperienceRow[]): ChartDataPoint[] {
  const monthlyData = experience.reduce((acc, row) => {
    if (!acc[row.month]) {
      acc[row.month] = { month: row.month }
    }
    acc[row.month][row.category] = (acc[row.month][row.category] || 0) + row.amount
    return acc
  }, {} as Record<string, ChartDataPoint>)
  
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Get top N claimants from member-level data
 */
export function getTopClaimants(memberClaims: MemberClaim[], topN = 10): TopClaimant[] {
  const claimantTotals = memberClaims.reduce((acc, claim) => {
    if (!acc[claim.memberId]) {
      acc[claim.memberId] = { totalAmount: 0, claimCount: 0 }
    }
    acc[claim.memberId].totalAmount += claim.paidAmount
    acc[claim.memberId].claimCount += 1
    return acc
  }, {} as Record<string, { totalAmount: number; claimCount: number }>)
  
  const totalAmount = Object.values(claimantTotals).reduce((sum, data) => sum + data.totalAmount, 0)
  
  return Object.entries(claimantTotals)
    .map(([memberId, data]) => ({
      memberId,
      totalAmount: data.totalAmount,
      claimCount: data.claimCount,
      percentage: totalAmount > 0 ? (data.totalAmount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, topN)
}

/**
 * Get unique months from experience data, sorted
 */
export function getUniqueMonths(experience: ExperienceRow[]): string[] {
  const months = [...new Set(experience.map(row => row.month))]
  return months.sort()
}

/**
 * Get unique categories from experience data, sorted by total amount
 */
export function getUniqueCategories(experience: ExperienceRow[]): string[] {
  const categoryTotals = aggregateByCategory(experience)
  return categoryTotals.map(cat => cat.category)
}

/**
 * Filter experience data by date range
 */
export function filterByDateRange(
  experience: ExperienceRow[], 
  startMonth?: string, 
  endMonth?: string
): ExperienceRow[] {
  return experience.filter(row => {
    if (startMonth && row.month < startMonth) return false
    if (endMonth && row.month > endMonth) return false
    return true
  })
}

/**
 * Get date range options for filtering
 */
export function getDateRangeOptions(months: string[]) {
  if (months.length === 0) return []
  
  const sortedMonths = [...months].sort()
  const latestMonth = sortedMonths[sortedMonths.length - 1]
  const [year] = latestMonth.split('-')
  const currentYear = new Date().getFullYear().toString()
  
  return [
    { label: 'All Time', value: 'all' },
    { label: 'Last 12 Months', value: 'last12' },
    { label: 'Year to Date', value: 'ytd', year: currentYear },
    { label: `${year} Full Year`, value: 'year', year },
  ]
}