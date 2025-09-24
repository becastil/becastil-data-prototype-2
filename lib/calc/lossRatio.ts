import { ExperienceRow } from '../schemas/experience'
import { FeesRow, MonthlySummary } from '../schemas/fees'

/**
 * Calculate loss ratio for a given month
 * Loss Ratio = Claims / Premium
 */
export function calculateLossRatio(claims: number, premium: number): number | null {
  if (premium <= 0) return null
  return claims / premium
}

/**
 * Calculate rolling 12-month loss ratio
 * Requires at least 12 months of data
 */
export function calculateRolling12LossRatio(
  summaries: MonthlySummary[],
  currentIndex: number
): number | null {
  const startIndex = Math.max(0, currentIndex - 11)
  const rollingData = summaries.slice(startIndex, currentIndex + 1)
  
  if (rollingData.length < 12) return null
  
  const totalClaims = rollingData.reduce((sum, s) => sum + s.claims, 0)
  const totalPremium = rollingData.reduce((sum, s) => sum + s.premium, 0)
  
  return calculateLossRatio(totalClaims, totalPremium)
}

/**
 * Calculate fees total for a month
 */
export function calculateFeesTotal(fees: FeesRow): number {
  return fees.tpaFee + fees.networkFee + fees.stopLossPremium + fees.otherFees
}

/**
 * Compute monthly summaries from experience data and fees
 */
export function computeMonthlySummaries(args: {
  experience: ExperienceRow[]
  feesByMonth: Record<string, FeesRow>
}): MonthlySummary[] {
  const { experience, feesByMonth } = args
  
  // Group experience data by month
  const monthlyData = experience.reduce((acc, row) => {
    if (!acc[row.month]) {
      acc[row.month] = { claims: 0, premium: 0 }
    }
    
    // Determine claims amount - prioritize explicit claims field, otherwise use category-based logic
    let claimsAmount = 0
    if (row.claims !== undefined) {
      claimsAmount = row.claims
    } else if (row.category.toLowerCase().includes('claim')) {
      claimsAmount = row.amount
    }
    
    acc[row.month].claims += claimsAmount
    acc[row.month].premium += row.premium || 0
    
    return acc
  }, {} as Record<string, { claims: number; premium: number }>)
  
  // Create summaries for each month
  const months = Object.keys(monthlyData).sort()
  const summaries: MonthlySummary[] = months.map((month, index) => {
    const data = monthlyData[month]
    const fees = feesByMonth[month] || { tpaFee: 0, networkFee: 0, stopLossPremium: 0, otherFees: 0, month }
    const feesTotal = calculateFeesTotal(fees)
    const totalCost = data.claims + feesTotal
    const lossRatio = calculateLossRatio(data.claims, data.premium)
    
    return {
      month,
      claims: data.claims,
      premium: data.premium,
      feesTotal,
      totalCost,
      lossRatio,
      r12LossRatio: null, // Will be calculated in second pass
    }
  })
  
  // Calculate rolling 12-month loss ratios
  summaries.forEach((summary, index) => {
    summary.r12LossRatio = calculateRolling12LossRatio(summaries, index)
  })
  
  return summaries
}

/**
 * Calculate totals across all summaries
 */
export function calculateTotals(summaries: MonthlySummary[]) {
  return summaries.reduce(
    (totals, summary) => ({
      claims: totals.claims + summary.claims,
      premium: totals.premium + summary.premium,
      feesTotal: totals.feesTotal + summary.feesTotal,
      totalCost: totals.totalCost + summary.totalCost,
    }),
    { claims: 0, premium: 0, feesTotal: 0, totalCost: 0 }
  )
}