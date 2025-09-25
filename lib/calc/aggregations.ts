import { ExperienceRow } from '../schemas/experience'
import { HighCostClaimant } from '../schemas/highCost'
import { CategoryTotal, TopClaimant, ChartDataPoint } from '../schemas/fees'

interface AmountBandDefinition {
  label: string
  min: number
  max: number
}

export interface ClaimantAmountBand {
  label: string
  count: number
  totalAmount: number
  averageAmount: number
}

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
export function getTopClaimants(claimants: HighCostClaimant[], topN = 10): TopClaimant[] {
  const totalAmount = claimants.reduce((sum, claimant) => sum + claimant.total, 0)

  return claimants
    .map(claimant => ({
      memberId: claimant.memberId,
      totalAmount: claimant.total,
      claimCount: 1,
      percentage: totalAmount > 0 ? (claimant.total / totalAmount) * 100 : 0,
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

export function getTopDiagnosisCategories(claimants: HighCostClaimant[], topN = 5) {
  const totals = claimants.reduce((acc, claimant) => {
    const key = claimant.primaryDiagnosisCategory || 'Unspecified'
    acc[key] = (acc[key] || 0) + claimant.total
    return acc
  }, {} as Record<string, number>)

  const grandTotal = Object.values(totals).reduce((sum, amount) => sum + amount, 0)

  return Object.entries(totals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, topN)
}

export function getCostDistribution(claimants: HighCostClaimant[]) {
  return claimants.reduce(
    (totals, claimant) => ({
      facilityInpatient: totals.facilityInpatient + claimant.facilityInpatient,
      facilityOutpatient: totals.facilityOutpatient + claimant.facilityOutpatient,
      professional: totals.professional + claimant.professional,
      pharmacy: totals.pharmacy + claimant.pharmacy,
    }),
    { facilityInpatient: 0, facilityOutpatient: 0, professional: 0, pharmacy: 0 }
  )
}

const AMOUNT_BANDS: AmountBandDefinition[] = [
  { label: '$50K to $200K', min: 50_000, max: 200_000 },
  { label: '$200K to $500K', min: 200_000, max: 500_000 },
  { label: '$1M to $2M', min: 1_000_000, max: 2_000_000 },
  { label: '$2M to $3.5M', min: 2_000_000, max: 3_500_000 },
]

export function getClaimantAmountBands(claimants: HighCostClaimant[]): ClaimantAmountBand[] {
  const bandTotals = AMOUNT_BANDS.map(() => ({ count: 0, totalAmount: 0 }))

  claimants.forEach(claimant => {
    const bandIndex = AMOUNT_BANDS.findIndex(band => claimant.total >= band.min && claimant.total < band.max)
    if (bandIndex === -1) return

    bandTotals[bandIndex].count += 1
    bandTotals[bandIndex].totalAmount += claimant.total
  })

  return AMOUNT_BANDS.map((band, index) => {
    const { count, totalAmount } = bandTotals[index]
    return {
      label: band.label,
      count,
      totalAmount,
      averageAmount: count > 0 ? totalAmount / count : 0,
    }
  })
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
